import BigNumber from 'bignumber.js'
import {Negotiation, NegotiationMsg, Attestation} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {serverLogger} from '@shared/logger'

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
  serverLogger.debug('Storing solicitation...')
  await Negotiation.create({
    id: persistData.session,
    initialReward: persistData.reward,
    attestationTopic: toBuffer(persistData.attestationTopic),
    attestationId: persistData.attestationId,
  })

  serverLogger.debug('Created negotiation...')
  const newAttestation = await Attestation.findOne({
    where: {
      id: persistData.attestationId,
    },
    order: [['createdAt', 'DESC']],
  })

  if (newAttestation !== null) {
    serverLogger.debug('Found attestation...')
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
  serverLogger.debug('Storing attestation bid...')
  await NegotiationMsg.create({
    futureTopic: toBuffer(persistData.topic),
    messageType: persistData.messageType,
    negotiationId: persistData.negotiationSession,
    bid: persistData.reward,
    regardingUuid: persistData.reSession,
  })
  serverLogger.debug('Found negotiation message...')
  const attestation = await Attestation.create({
    role: 'attester',
    type: persistData.type,
    negotiationId: persistData.negotiationSession,
    reward: persistData.reward,
  })
  serverLogger.debug('Created attestation...', attestation.id)
  const existingNegotiation = await Negotiation.findById(
    persistData.negotiationSession
  )
  if (!existingNegotiation) {
    serverLogger.debug('Creating negotiation...', attestation.id)
    await Negotiation.create({
      id: persistData.negotiationSession,
      initialReward: persistData.reward,
      attestationId: attestation.id,
      attestationTopic: toBuffer(persistData.topic),
    })
  }
  serverLogger.debug('Finished storing attestation bid.')
}

export const storeSendPaymentAuthorization = async (
  persistData: ISendPaymentAuthorizationStore
) => {
  try {
    serverLogger.info(
      '[storeSendPaymentAuthorization] ' + JSON.stringify(persistData)
    )
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
    serverLogger.debug('Finished [storeSendPaymentAuthorization]')
  } catch (err) {
    serverLogger.error('ERROR [storeSendPaymentAuthorization]', err)
  }
}
