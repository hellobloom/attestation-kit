import * as m from '@shared/models'
import {serverLogger} from '@shared/logger'

import {boss} from '@shared/jobs/boss'

import * as dc from 'deepcopy'

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
    const boss_instance = await boss
    boss_instance.publish('submit-attestation', {
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
