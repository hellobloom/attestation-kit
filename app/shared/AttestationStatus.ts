export enum CognitoSMSStatus {
  pending = 'pending',
  delivered = 'delivered',
  failed_to_deliver = 'failed_to_deliver',
  verified = 'verified',
  expired = 'expired',
}

export enum EmailAttestationStatus {
  pending = 'pending',
  delivered = 'delivered',
  failed_to_deliver = 'failed_to_deliver',
  verified = 'verified',
  expired = 'expired',
}

export enum GenericAttestationStatus {
  pending = 'pending',
  complete = 'complete',
}
