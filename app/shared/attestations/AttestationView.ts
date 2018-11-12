import {AttestationStatus} from '@bloomprotocol/attestations-lib'
import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {EmailAttestationStatus} from '@shared/attestations/EmailAttestationStatus'

export type AttestationView = {
  id: string // A uuid
  [value: string]: string
  status: AttestationStatus
  verificationStatus: CognitoSMSStatus | EmailAttestationStatus
}
