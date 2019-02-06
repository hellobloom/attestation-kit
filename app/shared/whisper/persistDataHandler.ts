import BigNumber from 'bignumber.js'
import {Negotiation, NegotiationMsg, Attestation} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {log} from '@shared/logger'

export enum PersistDataTypes {
  storeSolicitation = 'storeSolicitation',
  storeAttestationBid = 'storeAttestationBid',
  storeSendPaymentAuthorization = 'storeSendPaymentAuthorization',
}

export type TPersistData =
  | ISolicitationStore
  | IAttestationBidStore
  | ISendPaymentAuthorizationStore

export interface ISolicitationStore {
  attestationId: string
  messageType: PersistDataTypes.storeSolicitation
  session: string
  reward: BigNumber
  topic: string
  negotiationSession: string
  attestationTopic: string
}

export interface IAttestationBidStore {
  messageType: PersistDataTypes.storeAttestationBid
  session: string
  reward: BigNumber
  topic: string
  negotiationSession: string
  reSession: string
  type?: string
}

export interface ISendPaymentAuthorizationStore {
  messageType: PersistDataTypes.storeSendPaymentAuthorization
  session: string
  reSession: string
  reward: BigNumber
  negotiationSession: string
  paymentNonce: string
  paymentSig: string
}

export const storeSolicitation = async (persistData: ISolicitationStore) => {
  log('Storing solicitation...', {level: 'debug'})
  await Negotiation.create({
    id: persistData.session,
    initialReward: persistData.reward,
    attestationTopic: toBuffer(persistData.attestationTopic),
    attestationId: persistData.attestationId,
  })

  log('Created negotiation...', {level: 'debug'})
  const newAttestation = await Attestation.findOne({
    where: {
      id: persistData.attestationId,
    },
    order: [['createdAt', 'DESC']],
  })

  if (newAttestation !== null) {
    log('Found attestation...', {level: 'debug'})
    await newAttestation.update({negotiationId: persistData.session})
    await NegotiationMsg.create({
      negotiationId: persistData.session,
      futureTopic: toBuffer(persistData.topic),
      messageType: persistData.messageType,
      replyTo: '',
    })
  } else {
    throw new Error('store solicitation failed')
  }
}

export const storeAttestationBid = async (persistData: IAttestationBidStore) => {
  log('Storing attestation bid...', {level: 'debug'})
  await NegotiationMsg.create({
    futureTopic: toBuffer(persistData.topic),
    messageType: persistData.messageType,
    negotiationId: persistData.negotiationSession,
    bid: persistData.reward,
    regardingUuid: persistData.reSession,
  })
  log('Found negotiation message...', {level: 'debug'})
  const attestation = await Attestation.create({
    role: 'attester',
    type: persistData.type,
    negotiationId: persistData.negotiationSession,
    reward: persistData.reward,
  })
  log(`Created attestation with ID ${attestation.id}`, {level: 'debug'})
  const existingNegotiation = await Negotiation.findById(
    persistData.negotiationSession
  )
  if (!existingNegotiation) {
    log(`Creating negotiation for attestation ID ${attestation.id}`, {
      level: 'debug',
    })
    await Negotiation.create({
      id: persistData.negotiationSession,
      initialReward: persistData.reward,
      attestationId: attestation.id,
      attestationTopic: toBuffer(persistData.topic),
    })
  }
  log('Finished storing attestation bid.', {level: 'debug'})
}

export const storeSendPaymentAuthorization = async (
  persistData: ISendPaymentAuthorizationStore
) => {
  try {
    log('[storeSendPaymentAuthorization] ' + JSON.stringify(persistData))
    await NegotiationMsg.create({
      messageType: persistData.messageType,
      regardingUuid: persistData.reSession,
      negotiationId: persistData.negotiationSession,
      bid: persistData.reward,
    })
    const attestation = await Attestation.findOne({
      where: {
        negotiationId: persistData.negotiationSession,
        role: 'requester',
      },
    })
    if (attestation === null) throw new Error('Attestation not found')

    await attestation.update({
      paymentSig: toBuffer(persistData.paymentSig),
      paymentNonce: persistData.paymentNonce,
    })
    log('Finished [storeSendPaymentAuthorization]', {level: 'debug'})
  } catch (err) {
    log(`ERROR [storeSendPaymentAuthorization]: ${JSON.stringify(err)}`)
  }
}
