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
import {log} from '@shared/logger'

let envPr = env()

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

export const allTopicTypes: Array<TWhisperEntity> = extraTopicTypes.concat(
  attestationTopicTypes
)

// resolves to topicType => getTopic[tt]
export const allTopicsPr = Promise.all(allTopicTypes.map(getTopic)).then(ks => {
  let topics = {}
  allTopicTypes.forEach((k, i) => {
    topics[k] = ks[i]
  })
  return topics
})

// resolves to topicType => toTopic(getTopic[tt])
export const topicsHashedPr = allTopicsPr
  .then(ats => {
    return Promise.all(Object.values(ats).map(toTopic))
  })
  .then(ths => {
    let nths = {}
    allTopicTypes.forEach((k, i) => {
      nths[k] = ths[i]
    })
    return nths
  })

// resolves to toTopic(getTopic[tt]) => topicType
export const hashedTopicToAttestationTypePr = topicsHashedPr.then(th => invert(th))

/* const hashedToUnhashedTopicsPr = Promise.all([allTopicsPr, topicsHashedPr]).then(
  objs => {
    let topics = objs[0]
    let hashedTopics = objs[1]
    let hashedToUnhashedTopics = {}
    allTopicTypes.forEach((k, i) => {
      hashedToUnhashedTopics[hashedTopics[k]] = topics[k]
    })
    return hashedToUnhashedTopics
  }
) 
allTopicTypes.forEach(k => {
  let topic = getTopic(k)
  topicsHashed[k] = toTopic(topic)
  hashedToUnhashedTopics[topicsHashed[k]] = topic
}) 
console.log('topicsHashed', JSON.stringify(topicsHashed))
console.log('hashedToUnhashedTopics', JSON.stringify(hashedToUnhashedTopics)) */

export const allowEntity = async (addr: string, type: string, entity: string) => {
  let e = await envPr
  var obj = entity === 'requester' ? e.approved_requesters : e.approved_attesters
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

  let hashedTopicsToAT = await hashedTopicToAttestationTypePr
  log(['debug hashedTopicsToAt', hashedTopicsToAT, hashedTopicsToAT[type]], {
    level: 'debug',
  })
  const attestationType = hashedTopicsToAT[type]

  if (obj[attestationType] && includes(obj[attestationType], addr)) {
    return true
  }
  return false
}
