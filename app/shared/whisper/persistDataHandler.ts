import BigNumber from 'bignumber.js'
import {Negotiation, NegotiationMsg, Attestation} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'
import {serverLogger} from '@shared/logger'

export enum PersistDataTypes {
  storeSolicitation = 'storeSolicitation',
  storeAttestationBid = 'storeAttestationBid',
  storeAwaitSubjectData = 'storeAwaitSubjectData',
  storeSendJobDetails = 'storeSendJobDetails',
  storeStartAttestation = 'storeStartAttestation',
}

export type TPersistData =
  | ISolicitationStore
  | IAttestationBidStore
  | IAwaitSubjectDataStore
  | ISendJobDetailsStore
  | IStartAttestationStore

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

export interface IAwaitSubjectDataStore {
  messageType: PersistDataTypes.storeAwaitSubjectData
  session: string
  reSession: string
  replyTo: string
  negotiationSession: string
  reward: BigNumber
}

export interface ISendJobDetailsStore {
  messageType: PersistDataTypes.storeSendJobDetails
  session: string
  reSession: string
  reward: BigNumber
  topic: string
  negotiationSession: string
  paymentNonce: string
}

export interface IStartAttestationStore {
  messageType: PersistDataTypes.storeStartAttestation
  session: string
  reSession: string
  replyTo: string
  negotiationSession: string
  reward: BigNumber
  jobDetails: IStoreJobDetails
}

export interface IStoreJobDetails {
  subject: string
  attester: string
  requester: string
  subjectData: IAttestationDataJSONB
  subjectRequestNonce: string
  typeIds: number[]
  type: string
  subjectSignature: string
  paymentSignature: string
  paymentNonce: string
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

export const storeAwaitSubjectData = async (persistData: IAwaitSubjectDataStore) => {
  serverLogger.debug('Storing "await subject" data...')

  await NegotiationMsg.create({
    messageType: persistData.messageType,
    regardingUuid: persistData.reSession,
    replyTo: persistData.replyTo,
    negotiationId: persistData.negotiationSession,
    bid: persistData.reward,
  })
}

export const storeSendJobDetails = async (persistData: ISendJobDetailsStore) => {
  serverLogger.debug('Storing "send job details"...')
  await NegotiationMsg.create({
    futureTopic: toBuffer(persistData.topic),
    messageType: persistData.messageType,
    negotiationId: persistData.negotiationSession,
    regardingUuid: persistData.reSession,
  })
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: persistData.negotiationSession,
      role: 'requester',
    },
  })
  if (attestation === null) throw new Error('Attestation not found')

  await attestation.update({
    paymentNonce: persistData.paymentNonce,
  })
  // TODO delete temporarily stored data?
  serverLogger.debug('Finished storing SJD...')
}

export const storeStartAttestation = async (persistData: IStartAttestationStore) => {
  serverLogger.debug('Storing "start attestation"...')
  await NegotiationMsg.create({
    messageType: persistData.messageType,
    regardingUuid: persistData.reSession,
    replyTo: persistData.replyTo,
    negotiationId: persistData.negotiationSession,
    bid: persistData.reward,
  })
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: persistData.negotiationSession,
      role: 'attester',
    },
  })
  if (attestation === null) throw new Error('Attestation not found')

  await attestation.update({
    subject: toBuffer(persistData.jobDetails.subject),
    attester: toBuffer(persistData.jobDetails.attester),
    requester: toBuffer(persistData.jobDetails.requester),
    type: persistData.jobDetails.type,
    types: persistData.jobDetails.typeIds,
    data: persistData.jobDetails.subjectData,
    requestNonce: persistData.jobDetails.subjectRequestNonce,
    subjectSig: toBuffer(persistData.jobDetails.subjectSignature),
    paymentSig: toBuffer(persistData.jobDetails.paymentSignature),
    paymentNonce: persistData.jobDetails.paymentNonce,
  })
  serverLogger.debug('Finished storing SA...')
}
