import {AttestationTypeID, AttestationTypeIDs} from '@bloomprotocol/attestations-lib'
import {EmailAttestationStatus} from '@shared/attestations/EmailAttestationStatus'
import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {GenericAttestationStatus} from '@shared/AttestationStatus'
import {invert} from 'lodash'
import {env} from '@shared/environment'
import {toTopic} from '@shared/attestations/whisper'
import {includes} from 'lodash'

export function getTypedPendingStatus(
  typeId: AttestationTypeID
): EmailAttestationStatus | CognitoSMSStatus | GenericAttestationStatus {
  if (typeId === AttestationTypeID.email) {
    return EmailAttestationStatus.pending
  } else if (typeId === AttestationTypeID.phone) {
    return CognitoSMSStatus.pending
  } else if (AttestationTypeIDs.indexOf(typeId as any) !== -1) {
    return GenericAttestationStatus.pending
  } else {
    throw `AttestationTypeID '${typeId}' not supported`
  }
}

export const topicToAttestationType = invert(env.whisper.topics)

export const topicsHashed = {}
export const hashedToUnhashedTopics = {}

Object.keys(env.whisper.topics).forEach(k => {
  topicsHashed[k] = toTopic(env.whisper.topics[k].toString())
  hashedToUnhashedTopics[topicsHashed[k]] = env.whisper.topics[k]
})

export const hashedTopicToAttestationType = invert(topicsHashed)

export const allowEntity = (addr: string, type: string, entity: string) => {
  var obj = entity == 'requester' ? env.approved_requesters : env.approved_attesters

  if (!obj) {
    // in future, we can have alternate ways of passing in criteria here
    return false
  }
  if (obj.any) {
    return true
  }
  if (obj.all && includes(obj.all, addr)) {
    return true
  }

  const attestationType = hashedTopicToAttestationType[type]

  if (obj[attestationType] && includes(obj[attestationType], addr)) {
    return true
  }
  return false
}
