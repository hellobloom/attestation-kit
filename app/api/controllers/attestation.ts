import * as m from '@shared/models'
import {log} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import * as dc from 'deepcopy'
import * as express from 'express'
import {
  AttestationTypeNames,
  HashingLogic,
  AttestationStatus,
} from '@bloomprotocol/attestations-lib'
import {env, getContractAddr, getJobConfig} from '@shared/environment'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {Attestation} from '@shared/models'
import {
  IAttestParams,
  validateAttestParams,
} from '@shared/attestations/validateAttestParams'

let envPr = env()

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
    log('Received request to perform attestation...')
    attestation.update({
      result: {
        attestationId: attestation.id,
      },
    })
    // tie in - perform attestation
    const bossInstance = await boss
    bossInstance.publish(
      'submit-attestation',
      {
        negotiationId: req.body.negotiation_id || attestation.negotiationId,
        attestationId: attestation.id,
        gasPrice: req.body.gas_price,
      },
      await getJobConfig('submitAttestation')
    )
    //
    res.json({success: true, attestation})
  } else {
    res.status(404).json({success: false, message: 'Not found'})
  }
}

let dataNodeTests = {
  defined: (dataNode: any) => typeof dataNode !== 'undefined',
  dataDefined: (dataNode: any) => typeof dataNode.data !== 'undefined',
  dataDataDefined: (dataNode: any) => typeof dataNode.data.data === 'string',
  dataNonceDefined: (dataNode: any) => typeof dataNode.data.nonce === 'string',
  dataVersionDefined: (dataNode: any) => typeof dataNode.data.version === 'string',
  typeDefined: (dataNode: any) => typeof dataNode.type !== 'undefined',
  validType: (dataNode: any) =>
    AttestationTypeNames.indexOf(dataNode.type.type) > -1,
  typeNonceDefined: (dataNode: any) => typeof dataNode.type.nonce === 'string',
  auxDefined: (dataNode: any) => typeof dataNode.aux === 'string',
}

export const receiveSubjectData: express.RequestHandler = async (req, res) => {
  let e = await envPr
  if (!Array.isArray(req.body.dataNodes) || !req.body.dataNodes.length) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain a non-empty dataNodes array.',
    })
  }

  let errors: Array<{error: string; index: number; testFailed?: boolean}> = []

  let nodes = req.body.dataNodes as Array<any>
  nodes.forEach((dataNode: any, i) => {
    Object.keys(dataNodeTests).forEach(k => {
      let test = dataNodeTests[k]
      try {
        let testResult = test(dataNode)
        if (!testResult) {
          errors.push({error: k, index: i})
        }
      } catch (err) {
        errors.push({error: k, index: i, testFailed: true})
      }
    })
  })

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        'Each data node in the dataNodes field must contain a properly structured IAttestation.',
      errors: errors,
    })
  }

  const dataNodes: HashingLogic.IAttestation[] = req.body.dataNodes
  const attesterPrivateKey = toBuffer(e.owner.key)
  const merkleTreeComponents = HashingLogic.getSignedMerkleTreeComponents(
    dataNodes,
    attesterPrivateKey
  )
  log(
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
    typeof req.body.gasPrice !== 'string' ||
    typeof req.body.network !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Request body must contain the fields of an attestation agreement,' +
        ' an negotiationId, a signature, and a gasPrice.',
    })
  }
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: req.body.negotiationId,
      role: 'attester',
      status: AttestationStatus.ready,
    },
  })

  if (!attestation) {
    return res.status(400).json({
      success: false,
      message: `Attestation not found for negotiation id ${req.body.negotiationId}`,
    })
  }

  const attestParams: IAttestParams = {
    attestationId: attestation.id,
    subject: req.body.subject,
    attester: req.body.attester,
    requester: req.body.requester,
    reward: attestation.reward,
    requesterSig: bufferToHex(attestation.paymentSig),
    dataHash: req.body.dataHash,
    requestNonce: req.body.nonce,
    subjectSig: req.body.signature,
    attestationLogicAddress: await getContractAddr('AttestationLogic'),
    tokenEscrowMarketplaceAddress: await getContractAddr('TokenEscrowMarketplace'),
  }

  const validationResult = await validateAttestParams(attestParams)
  if (validationResult.kind === 'validated') {
    // Call attestation logic `attest` and webhook bloom-web with tx and more
    const bossInstance = await boss
    Object.assign(attestParams, {
      gasPrice: req.body.gasPrice,
      network: req.body.network,
    })
    bossInstance.publish(
      'submit-attestation',
      attestParams,
      await getJobConfig('submitAttestation')
    )

    log(
      {
        name: 'AttestationEvent',
        event: {
          Action: 'EnqueueAttest',
          AttestationId: attestParams.attestationId,
        },
      },
      {event: true}
    )

    return res.status(200).json({success: true})
  } else {
    return res.status(400).json({
      success: false,
      message: validationResult.message,
    })
  }
}
