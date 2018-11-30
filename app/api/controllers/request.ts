import * as m from '@shared/models'
import * as dc from 'deepcopy'
import {env} from '@shared/environment'
import BigNumber from 'bignumber.js'
import {initiateSolicitation} from '@shared/whisper/requesterActions'
import {requesterWallet} from '@shared/attestations/attestationWallets'
import {getAttestationTypeStr} from '@bloomprotocol/attestations-lib'
import {toBuffer} from 'ethereumjs-util'
import {toTopic} from '@shared/whisper'
const uuid = require('uuidv4')
import * as Web3 from 'web3'

// list all requests
export const show = (req: any, res: any) => {
  const where = req.body.where ? dc(req.body.where) : {}
  where.role = 'requester'

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

// create request
export const create = async (req: any, res: any) => {
  const attestation_type =
    req.body.attestation_type || getAttestationTypeStr(req.body.attestation_type_id)

  const attestation = await m.Attestation.create({
    subject: toBuffer(req.body.subject_eth_address),
    type: attestation_type,
    types: [req.body.attestation_type_id],
    role: 'requester',
  })

  if (typeof env.whisper.topics[attestation_type] === 'undefined') {
    res.status(422).json({
      success: false,
      error: 'No topic configured for attestation type',
      attestation_type: attestation_type,
    })
    return
  }

  const sessionId = uuid()
  const reward = new BigNumber(
    // Note that the reward parameter is measured in whole BLT, >>> NOT in wei or gwei !!! <<<
    Web3.prototype.toWei(req.body.reward, 'ether') 
  )

  await initiateSolicitation(
    attestation.id,
    reward,
    toTopic(env.whisper.topics[attestation_type].toString()),
    env.whisper.password,
    requesterWallet,
    sessionId
  )

  // tie in - initiate whisper interactions
  res.json({success: true, sessionId})
}
