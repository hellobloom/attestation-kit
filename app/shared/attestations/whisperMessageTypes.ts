import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'

export enum MessageTypes {
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
  messageType: MessageTypes.solicitation
  sessionSigned: string // signed sessionId of this message
  rewardAsk: string // BigNumber as string
}

// Message #2. Responding with a bid.
export interface IAttestationBid extends IBloomWhisperResponse {
  messageType: MessageTypes.attestationBid
  rewardBid: string
}

// Message #3, accepting the bid and revealing subject information
export interface ISubmitSubjectData extends IBloomWhisperResponse {
  messageType: MessageTypes.sendJobDetails
  reward: string
}

// Message #3, accepting the bid and revealing subject information
export interface ISendJobDetails extends IBloomWhisperResponse {
  messageType: MessageTypes.sendJobDetails
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
  messageType: MessageTypes.requestPayment
  reward: string
}

// Message #5, send payment authorization to attester
export interface IPaymentAuthorization extends IBloomWhisperResponse {
  messageType: MessageTypes.paymentAuthorization
  reward: string
  paymentNonce: string
  paymentSig: string
}

// Message #6, Notify attestation is complete
export interface IAttestationSubmitted extends IBloomWhisperResponse {
  messageType: MessageTypes.attestationSubmitted
  txHash: string
  attestationId: number
  subjectAddress: string
}
