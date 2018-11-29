import * as m from '@shared/models'
import {serverLogger} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import * as dc from 'deepcopy'
import * as express from 'express'
import {AttestationTypeNames, HashingLogic} from '@bloomprotocol/attestations-lib'
import {env} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'
import {
  validateDateNodes,
  validateSignedAgreement,
} from '@shared/attestations/validations'

// list all attestations
export const show = (req: any, res: any) => {
  const where = req.body.where ? dc(req.body.where) : {}
  where.role = 'attester'

  let perPage = req.body.per_page ? parseInt(req.body.per_page, 10) : 100
  let offset = req.body.page ? perPage * parseInt(req.body.page, 10) : 0

  m.Attestation.findAll({
    where: where,
    limit: perPage,
    offset: offset,
  }).then(r => {
    res.json({success: true, attestations: r})
  })
}

// perform attestation on an existing request
export const perform = async (req: any, res: any) => {
  const attestation = await m.Attestation.findById(req.body.attestation_id)
  if (attestation) {
    serverLogger.info('Received request to perform attestation...')
    attestation.update({
      result: {
        attestationId: attestation.id,
      },
    })
    // tie in - perform attestation
    const bossInstance = await boss
    bossInstance.publish('submit-attestation', {
      negotiationId: req.body.negotiation_id || attestation.negotiationId,
      attestationId: attestation.id,
      gasPrice: req.body.gas_price,
    })
    //
    res.json({success: true, attestation})
  } else {
    res.status(404).json({success: false, message: 'Not found'})
  }
}

export const receiveSubjectData: express.RequestHandler = async (req, res) => {
  if (!Array.isArray(req.body.dataNodes) || !req.body.dataNodes.length) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain a non-empty dataNodes array.',
    })
  }
  if (
    !(req.body.dataNodes as Array<any>).every(dataNode => {
      return (
        typeof dataNode !== 'undefined' &&
        typeof dataNode.data !== 'undefined' &&
        typeof dataNode.data.data === 'string' &&
        typeof dataNode.data.nonce === 'string' &&
        typeof dataNode.data.version === 'string' &&
        typeof dataNode.type !== 'undefined' &&
        AttestationTypeNames.indexOf(dataNode.type.type) > -1 &&
        typeof dataNode.type.nonce === 'string' &&
        typeof dataNode.aux === 'string'
      )
    })
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Each data node in the dataNodes field must contain a properly structured IAttestation.',
    })
  }

  const dataNodes: HashingLogic.IAttestation[] = req.body.dataNodes
  const validationResult = validateDateNodes(dataNodes)
  if (validationResult.length) {
    return res.status(400).json({
      success: false,
      message: `Errors: ${validationResult.join('\n')}`,
    })
  }

  const attesterPrivateKey = toBuffer(env.owner.ethPrivKey)
  const merkleTreeComponents = HashingLogic.getSignedMerkleTreeComponents(
    dataNodes,
    attesterPrivateKey
  )
  serverLogger.info(
    `[receiveSubjectData] merkleTreeComponents: ${JSON.stringify(
      merkleTreeComponents
    )}`
  )

  return res.status(200).json({merkleTreeComponents})
}

export const receiveSignedAgreement: express.RequestHandler = async (req, res) => {
  if (
    typeof req.body.negotiationId !== 'string' ||
    typeof req.body.subject !== 'string' ||
    typeof req.body.requester !== 'string' ||
    typeof req.body.attester !== 'string' ||
    typeof req.body.dataHash !== 'string' ||
    typeof req.body.nonce !== 'string' ||
    typeof req.body.signature !== 'string' ||
    typeof req.body.gasPrice !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Request body must contain the fields of an attestation agreement,' +
        ' an negotiationId, a signature, and a gasPrice.',
    })
  }

  const validationResult = validateSignedAgreement(req.body)
  if (!validationResult) {
    return res.status(400).json({
      success: false,
      message:
        'Subject address recovered from signed agreement does not match passed in subject address.',
    })
  }

  // Call attestation logic `attest` and webhook bloom-web with tx and more
  const bossInstance = await boss
  bossInstance.publish('submit-attestation-v2', req.body)

  return res.status(200).json({success: true})
}
export interface ITxAttempt {
  id: number
  nonce: number
  txHash: Buffer
  tx_id: string
}
