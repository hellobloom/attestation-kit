import {HashingLogic} from '@bloomprotocol/attestations-lib'

export type TSignedAgreementRequestPayload = {
  requester: string
  subject: string
  dataHash: string
  nonce: string
  negotiationId: string
  signature: string
  gasPrice: string
}

// EH TODO VALIDATE DATA NODES
export const validateDateNodes = (
  dataNodes: HashingLogic.IAttestation[]
): string[] => []
