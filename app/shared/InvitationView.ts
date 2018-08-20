import {TxStatus} from '@shared/TxStatus'

export enum InvitationStatus {
  pending = 'pending',
  accepted = 'accepted',
}

export type TInvitationView = {
  acceptTx?: string
  acceptTxStatus?: TxStatus
  createTx: string
  createTxStatus: TxStatus
  status: InvitationStatus
  createdAt: Date
  inviteeEmail: string
  inviterEthAddress: string
}
