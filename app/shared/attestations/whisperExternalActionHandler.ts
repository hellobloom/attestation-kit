import {ISendJobDetails} from '@shared/attestations/whisperMessageTypes'
import {Attestation} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {AttestationStatus} from '@bloomprotocol/attestations-lib'
import {notifyCollectData, notifyDoAttestation} from '@shared/webhookHandler'
import {serverLogger} from '@shared/logger'

// Types of persisted data actions
// Create a new session
// Update session with bid results
// Update session with bid request

export enum ExternalActionTypes {
  awaitSubjectData = 'awaitSubjectData',
  performAttestation = 'performAttestation',
}

export type TExternalAction = ICollectSubjectData | IPerformAttestation

export interface ICollectSubjectData {
  actionType: ExternalActionTypes.awaitSubjectData
  negotiationSession: string
  attester: string
  requester: string
}

export interface IPerformAttestation {
  id: string
  actionType: ExternalActionTypes.performAttestation
  jobDetailsMessage: ISendJobDetails
}

export const collectSubjectData = async (input: ICollectSubjectData) => {
  serverLogger.debug('Notifying to collect subject data...')
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: input.negotiationSession,
      role: 'requester',
    },
  })
  if (attestation !== null) {
    await attestation.update({
      attester: toBuffer(input.attester),
      requester: toBuffer(input.requester),
      status: AttestationStatus.ready,
    })
    notifyCollectData({
      id: attestation.id,
      status: attestation.status,
      attester: input.attester,
      requester: input.requester,
      negotiationId: attestation.negotiationId,
    })
    serverLogger.debug('Finished notifying to collect subject data')
  } else {
    throw new Error('collect subject data failed failed')
  }
}

export const performAttestation = async (data: IPerformAttestation) => {
  notifyDoAttestation(data.jobDetailsMessage, data.id)
}
