export enum CognitoSMSStatus {
  pending = 'pending',
  delivered = 'delivered',
  failed_to_deliver = 'failed_to_deliver',
  verified = 'verified',
  expired = 'expired',
}

export type TTerminalVerificationStatus =
  | CognitoSMSStatus.verified
  | CognitoSMSStatus.expired
