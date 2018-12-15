import * as m from '@shared/models'
import * as dc from 'deepcopy'
import {env} from '@shared/environment'
import BigNumber from 'bignumber.js'
import {initiateSolicitation} from '@shared/whisper/requesterActions'
import {requesterWallet, attesterWallet} from '@shared/attestations/attestationWallets'
import {getAttestationTypeStr, HashingLogic, AttestationStatus} from '@bloomprotocol/attestations-lib'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {toTopic, getTopic} from '@shared/whisper'
const uuid = require('uuidv4')
const v = require('validator')
import * as Web3 from 'web3'
import { signPaymentAuthorization } from '@shared/ethereum/signingLogic'
import { notifyCollectData } from '@shared/webhookHandler'

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

  const att: any = {
    subject: toBuffer(req.body.subject_eth_address),
    type: attestation_type,
    types: [req.body.attestation_type_id],
    role: 'requester',
  }
  if (req.body.id && v.isUUID(req.body.id)) att.id = req.body.id
  const attestation = await m.Attestation.create(att)

  if (typeof getTopic(attestation_type) === 'undefined') {
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
    toTopic(getTopic(attestation_type)),
    env.whisper.password,
    requesterWallet,
    sessionId
  )

  // tie in - initiate whisper interactions
  res.json({success: true, sessionId})
}

export const createBypass = async (req: any, res: any) => {
  const attestation_type =
    req.body.attestation_type || getAttestationTypeStr(req.body.attestation_type_id)

  const reward = new BigNumber(
    // Note that the reward parameter is measured in whole BLT, >>> NOT in wei or gwei !!! <<<
    Web3.prototype.toWei(req.body.reward, 'ether')
  )

  const paymentNonce = HashingLogic.generateNonce()
  const paymentSig = signPaymentAuthorization(
    env.tokenEscrowMarketplace.address,
    requesterWallet.getAddressString(),
    attesterWallet.getAddressString(),
    reward.toString(10),
    paymentNonce,
    requesterWallet.getPrivateKey()
  )

  const sessionId = uuid()

  const att: Partial<m.Attestation> = {
    subject: toBuffer(req.body.subject_eth_address),
    attester: attesterWallet.getAddress(),
    requester: requesterWallet.getAddress(),
    status: AttestationStatus.ready,
    type: attestation_type,
    types: [req.body.attestation_type_id],
    role: 'attester',
    reward: reward,
    paymentNonce: paymentNonce,
    paymentSig: paymentSig,
    negotiationId: sessionId,
  }

  if (req.body.id && v.isUUID(req.body.id)) att.id = req.body.id
  const attestation = await m.Attestation.create(att)

    await notifyCollectData(
      {
        status: attestation.status,
        attester: bufferToHex(attestation.attester),
        requester: bufferToHex(attestation.requester),
        nonce: attestation.paymentNonce,
        negotiationId: attestation.negotiationId,
      },
      'v2'
    )

  res.json({success: true, sessionId})
}
