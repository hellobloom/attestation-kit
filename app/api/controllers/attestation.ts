import * as m from '@shared/models'
import {serverLogger} from '@shared/logger'

import {boss} from '@shared/jobs/boss'

import * as dc from 'deepcopy'

import * as express from 'express'
import {AttestationTypeNames, HashingLogic} from '@bloomprotocol/attestations-lib-v2'
import {env} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'
import {TVersion} from '@shared/version'

// list all attestations
export const show = (req: any, res: any) => {
  const where = req.body.where ? dc(req.body.where) : {}
  where.role = 'attester'

  let per_page = req.body.per_page ? parseInt(req.body.per_page) : 100
  let offset = req.body.page ? per_page * parseInt(req.body.page) : 0

  m.Attestation.findAll({
    where: where,
    limit: per_page,
    offset: offset,
  }).then(r => {
    res.json({success: true, attestations: r})
  })
}

// perform attestation on an existing request
export const perform = (version: TVersion) => async (req: any, res: any) => {
  serverLogger.info(`[/api/controller/attestation.ts] perform ${version}`)
  const attestation = await m.Attestation.findById(req.body.attestation_id)
  if (attestation) {
    serverLogger.info('Received request to perform attestation...')
    attestation.update({
      result: {
        attestationId: attestation.id,
      },
    })
    // tie in - perform attestation
    const boss_instance = await boss
    boss_instance.publish('submit-attestation', {
      negotiationId: req.body.negotiation_id || attestation.negotiationId,
      attestationId: attestation.id,
      gasPrice: req.body.gas_price,
      version,
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

  // EH TODO
  // Validate dataNodes

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
