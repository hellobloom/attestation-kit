import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'

export enum EMsgTypes {
  solicitation = 'solicitation',
  attestationBid = 'attestationBid',
  awaitSubjectData = 'awaitSubjectData',
  sendJobDetails = 'jobDetails',
  requestPayment = 'requestPayment',
  paymentAuthorization = 'paymentAuthorization',
  attestationSubmitted = 'attestationSubmitted',
}

export type TBloomMessage =
  | ISolicitation
  | IAttestationBid
  | ISendJobDetails
  | IRequestPayment
  | IPaymentAuthorization
  | IAttestationSubmitted

export interface IBloomWhisperMessage {
  messageType: string
  replyTo: string
  session: string
  negotiationSession: string
}

export interface IBloomWhisperResponse extends IBloomWhisperMessage {
  reSession: string // Unique ID for message this reply is regarding
  reSessionSigned: string // Signed UUID of incoming message
}

// Message #1. Asking "who can attest this kind of thing?"
export interface ISolicitation extends IBloomWhisperMessage {
  messageType: EMsgTypes.solicitation
  sessionSigned: string // signed sessionId of this message
  rewardAsk: string // BigNumber as string
}

// Message #2. Responding with a bid.
export interface IAttestationBid extends IBloomWhisperResponse {
  messageType: EMsgTypes.attestationBid
  rewardBid: string
}

// Message #3, accepting the bid and revealing subject information
export interface ISubmitSubjectData extends IBloomWhisperResponse {
  messageType: EMsgTypes.sendJobDetails
  reward: string
}

// Message #3, accepting the bid and revealing subject information
export interface ISendJobDetails extends IBloomWhisperResponse {
  messageType: EMsgTypes.sendJobDetails
  reward: string
  subjectData: IAttestationDataJSONB
  subjectRequestNonce: string
  typeIds: number[]
  subjectAddress: string
  subjectSignature: string
  paymentSignature: string
  paymentNonce: string
}

// Message #4, notify requester the job has been completed and request payment
export interface IRequestPayment extends IBloomWhisperResponse {
  messageType: EMsgTypes.requestPayment
  reward: string
}

// Message #5, send payment authorization to attester
export interface IPaymentAuthorization extends IBloomWhisperResponse {
  messageType: EMsgTypes.paymentAuthorization
  reward: string
  paymentNonce: string
  paymentSig: string
}

// Message #6, Notify attestation is complete
export interface IAttestationSubmitted extends IBloomWhisperResponse {
  messageType: EMsgTypes.attestationSubmitted
  txHash: string
  attestationId: number
  subjectAddress: string
}
