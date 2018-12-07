import {
  AttestationTypeID,
  AttestationTypes,
  AttestationTypeIDs,
} from '@bloomprotocol/attestations-lib'
import {EmailAttestationStatus} from '@shared/attestations/EmailAttestationStatus'
import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {GenericAttestationStatus} from '@shared/AttestationStatus'
import {invert} from 'lodash'
import {env} from '@shared/environment'
import {getTopic, TWhisperEntity, toTopic} from '@shared/whisper'
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

export const topicsHashed = {}
export const hashedToUnhashedTopics = {}

const extraTopicTypes: Array<TWhisperEntity> = ['ping', 'requester']
const attestationTopicTypes: Array<TWhisperEntity> = Object.keys(
  AttestationTypes
) as Array<TWhisperEntity>

var allTopicTypes: Array<TWhisperEntity> = extraTopicTypes.concat(
  attestationTopicTypes
)

allTopicTypes.forEach(k => {
  let topic = getTopic(k)
  topicsHashed[k] = toTopic(topic)
  hashedToUnhashedTopics[topicsHashed[k]] = topic
})

console.log('topicsHashed', JSON.stringify(topicsHashed))
console.log('hashedToUnhashedTopics', JSON.stringify(hashedToUnhashedTopics))

export const hashedTopicToAttestationType = invert(topicsHashed)

export const allowEntity = (addr: string, type: string, entity: string) => {
  var obj = entity === 'requester' ? env.approved_requesters : env.approved_attesters
  console.log(`DEBUG AE allowed: ${JSON.stringify(obj)}`)

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
