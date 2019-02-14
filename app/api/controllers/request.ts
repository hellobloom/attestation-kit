import * as m from '@shared/models'
import * as dc from 'deepcopy'
import {env, getContractAddr} from '@shared/environment'
import {log} from '@shared/logger'
import BigNumber from 'bignumber.js'
import {initiateSolicitation} from '@shared/whisper/requesterActions'
import {
  requesterWallet,
  attesterWallet,
} from '@shared/attestations/attestationWallets'
import {
  getAttestationTypeStr,
  HashingLogic,
  AttestationStatus,
} from '@bloomprotocol/attestations-lib'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {toTopic, getTopic} from '@shared/whisper'
const v = require('validator')
import * as Web3 from 'web3'
import {signPaymentAuthorization} from '@shared/ethereum/signingLogic'
import {notifyCollectData} from '@shared/webhookHandler'
const uuid = require('uuidv4')
let envPr = env()

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
  let e = await envPr
  let attestationId: string
  if (req.body.id && v.isUUID(req.body.id)) {
    attestationId = req.body.id
  } else {
    attestationId = uuid()
    // res.status(400).json({
    //   success: false,
    //   error: 'uuid formatted id missing in body',
    // })
    // return
  }
  const attestation_type =
    req.body.attestation_type || getAttestationTypeStr(req.body.attestation_type_id)

  const att: any = {
    id: attestationId,
    subject: toBuffer(req.body.subject_eth_address),
    type: attestation_type,
    types: [req.body.attestation_type_id],
    role: 'requester',
  }
  const attestation = await m.Attestation.create(att)

  if (typeof getTopic(attestation_type) === 'undefined') {
    res.status(422).json({
      success: false,
      error: 'No topic configured for attestation type',
      attestation_type: attestation_type,
    })
    return
  }

  const reward = new BigNumber(
    // Note that the reward parameter is measured in whole BLT, >>> NOT in wei or gwei !!! <<<
    Web3.prototype.toWei(req.body.reward, 'ether')
  )

  await initiateSolicitation(
    attestation.id,
    reward,
    await toTopic(await getTopic(attestation_type)),
    e.whisper.password,
    await requesterWallet,
    attestation.id
  )

  log(
    {
      name: 'AttestationEvent',
      event: {
        Action: 'Solicit',
        AttestationId: attestation.id,
        BypassNegotiation: false,
        Type: attestation_type,
      },
    },
    {event: true}
  )

  res.json({success: true, sessionId: attestation.id})
}

export const createBypass = async (req: any, res: any) => {
  if (!(req.body.id && v.isUUID(req.body.id))) {
    res.status(400).json({
      success: false,
      error: 'uuid formatted id missing in body',
    })
    return
  }

  const attestation_type =
    req.body.attestation_type || getAttestationTypeStr(req.body.attestation_type_id)

  const reward = new BigNumber(
    // Note that the reward parameter is measured in whole BLT, >>> NOT in wei or gwei !!! <<<
    Web3.prototype.toWei(req.body.reward, 'ether')
  )

  const paymentNonce = HashingLogic.generateNonce()
  let reqWallet = await requesterWallet
  let attWallet = await attesterWallet
  const paymentSig = signPaymentAuthorization(
    await getContractAddr('TokenEscrowMarketplace'),
    reqWallet.getAddressString(),
    attWallet.getAddressString(),
    reward.toString(10),
    paymentNonce,
    reqWallet.getPrivateKey()
  )

  const att: Partial<m.Attestation> = {
    id: req.body.id,
    subject: toBuffer(req.body.subject_eth_address),
    attester: attWallet.getAddress(),
    requester: reqWallet.getAddress(),
    status: AttestationStatus.ready,
    type: attestation_type,
    types: [req.body.attestation_type_id],
    role: 'attester',
    reward: reward,
    paymentNonce: paymentNonce,
    paymentSig: toBuffer(paymentSig),
    negotiationId: req.body.id,
  }

  console.log(JSON.stringify(att))

  const attestation = await m.Attestation.create(att)

  log('Created attestation')

  await notifyCollectData(
    {
      status: attestation.status,
      attester: bufferToHex(attestation.attester),
      requester: bufferToHex(attestation.requester),
      nonce: attestation.paymentNonce,
      id: attestation.negotiationId,
    },
    'v2'
  )

  log('notifyCollectData executed')

  log(
    {
      name: 'AttestationEvent',
      event: {
        Action: 'Solicit',
        AttestationId: attestation.id,
        BypassNegotiation: true,
        Type: attestation_type,
      },
    },
    {event: true}
  )

  log('AttestationEvent recorded', {level: 'debug'})

  res.json({success: true, sessionId: attestation.id})
}
