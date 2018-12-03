import * as newrelic from 'newrelic'
import {
  TPersistData,
  storeSolicitation,
  storeAttestationBid,
  PersistDataTypes,
  storeSendPaymentAuthorization,
} from '@shared/whisper/persistDataHandler'
import {
  TBloomMessage,
  EMsgTypes,
  IBloomWhisperMessage,
} from '@shared/whisper/msgTypes'
import * as Shh from 'web3-shh'
import * as Web3 from 'web3'
import * as Wallet from 'ethereumjs-wallet'
import {env} from '@shared/environment'
import {fetchAllMessages} from '@shared/whisper'
import {
  handleSolicitation,
  handlePaymentAuthorization,
} from '@shared/whisper/attesterActions'
import {handleAttestationBid} from '@shared/whisper/requesterActions'
import {
  MessageSubscriber,
  unsubscribeFromTopic,
  MessageSubscribers,
  subscribeToBroadcast,
} from '@shared/whisper/subscriptionHandler'
import {serverLogger} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import {confirmRequesterFunds} from '@shared/whisper/validateMsg'
import {AttestationTypeManifest} from '@bloomprotocol/attestations-lib'

export type TWhisperEntity = keyof AttestationTypeManifest | 'ping' | 'requester'

/* export enum Entities {
  // Non-attestation entities
  ping = 'Ping',
  requester = 'Requester',

  // Actual attestation types
  phoneAttester = 'PhoneAttester',
  emailAttester = 'EmailAttester',
  sanctionAttester = 'SanctionAttester',
  facebookAttester = 'FacebookAttester',
  pepAttester = 'PEPAttester',
  idAttester = 'IDAttester',
  linkedinAttester = 'LinkedinAttester',
  googleAttester = 'GoogleAttester',
  twitterAttester = 'TwitterAttester',
  payrollAttester = 'PayrollAttester',
  ssnAttester = 'SSNAttester',
  criminalAttester = 'CriminalAttester',
  offenseAttester = 'OffenseAttester',
  drivingAttester = 'DrivingAttester',
  employmentAttester = 'EmploymentAttester',
  educationAttester = 'EducationAttester',
  drugAttester = 'DrugAttester',
  bankAttester = 'BankAttester',
  utilityAttester = 'UtilityAttester',
  incomeAttester = 'IncomeAttester',
  assetsAttester = 'AssetsAttester',
  fullnameAttester = 'FullnameAttester',
  birthdateAttester = 'BirthdateAttester',
  genderAttester = 'GenderAttester',
}

export const AttestationTypeToEntity = {
  // Non-attestation entities
  ping: Entities.ping,
  requester: Entities.requester,

  // Actual attestation types
  phone: Entities.phoneAttester,
  email: Entities.emailAttester,
  'sanction-screen': Entities.sanctionAttester,
  facebook: Entities.facebookAttester,
  'pep-screen': Entities.pepAttester,
  'id-document': Entities.idAttester,
  google: Entities.googleAttester,
  linkedin: Entities.linkedinAttester,
  twitter: Entities.twitterAttester,
  payroll: Entities.payrollAttester,
  ssn: Entities.ssnAttester,
  criminal: Entities.criminalAttester,
  offense: Entities.offenseAttester,
  driving: Entities.drivingAttester,
  employment: Entities.employmentAttester,
  education: Entities.educationAttester,
  drug: Entities.drugAttester,
  bank: Entities.bankAttester,
  utility: Entities.utilityAttester,
  income: Entities.incomeAttester,
  assets: Entities.assetsAttester,
  'full-name': Entities.fullnameAttester,
  'birth-date': Entities.birthdateAttester,
  gender: Entities.genderAttester,
}
 */

export type TMsgHandler = (...args: any[]) => Promise<IMessageDecision | false>

export interface IMessageDecision {
  unsubscribeFrom: string | null // Topic recovered from message
  subscribeTo: MessageSubscriber | null
  respondTo: MessageSubscriber | null
  respondWith: TBloomMessage | null
  persist: TPersistData | null
}

const handleUnknownMessageType: TMsgHandler = async (
  message: IBloomWhisperMessage,
  messageTopic: string
) => {
  const decision: IMessageDecision = {
    unsubscribeFrom: null,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: null,
  }
  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'EncounteredUnknownMessageType',
  })

  return decision
}

const handleMessage = async (
  body: TBloomMessage,
  messageTopic: string,
  entity: string,
  wallet: Wallet.Wallet
) => {
  const date = new Date()
  serverLogger.debug(`${date}[handleMessage]`, JSON.stringify(body))
  serverLogger.debug(`${date}[handleMessage] body.messageType = ${body.messageType}`)
  let messageDecision: IMessageDecision | false
  if (body.hasOwnProperty('messageType')) {
    switch (body.messageType) {
      case EMsgTypes.solicitation:
        // this check is here to make handleSolicitation testable
        // confirmRequesterFunds performs a blockchain state read
        serverLogger.debug('Handling solicitation message')
        let confirmed = await confirmRequesterFunds(body)
        serverLogger.info('Requester funds?', confirmed)
        if (confirmed) {
          messageDecision = await handleSolicitation(body, messageTopic, wallet)
        } else {
          messageDecision = await handleUnknownMessageType(body, messageTopic)
        }
        if (!messageDecision) {
          return false
        }
        break
      case EMsgTypes.attestationBid:
        serverLogger.debug('Handling attestation message')
        messageDecision = await handleAttestationBid(body, messageTopic, wallet)
        break
      case EMsgTypes.paymentAuthorization:
        serverLogger.info('Handling handlePaymentAuthorization message')
        messageDecision = await handlePaymentAuthorization(
          body,
          messageTopic,
          wallet
        )
        break
      default:
        serverLogger.debug('Handling unknown message')
        messageDecision = await handleUnknownMessageType(body, messageTopic)
    }
  } else {
    serverLogger.debug('Handling unknown message (no type specified)')
    messageDecision = await handleUnknownMessageType(body, messageTopic)
  }
  serverLogger.debug('Message decision', messageDecision)
  return messageDecision
}

export const actOnMessage = async (
  messageDecision: IMessageDecision,
  entity: string
) => {
  serverLogger.info(
    'DEBUG [actOnMessage] ' + JSON.stringify({messageDecision, entity})
  )
  if (messageDecision.persist !== null) {
    switch (messageDecision.persist.messageType) {
      case PersistDataTypes.storeSolicitation:
        serverLogger.debug('Acting on message, storeSolicitation')
        await storeSolicitation(messageDecision.persist)
        break
      case PersistDataTypes.storeAttestationBid:
        serverLogger.debug('Acting on message, storeAttestationBid')
        await storeAttestationBid(messageDecision.persist)
        break
      case PersistDataTypes.storeSendPaymentAuthorization:
        serverLogger.debug('Acting on message, storeSendPaymentAuthorization')
        await storeSendPaymentAuthorization(messageDecision.persist)
        break
      default:
        break
    }
  }
  serverLogger.debug('Message acted upon')
  if (messageDecision.unsubscribeFrom !== null) {
    serverLogger.debug('Unsubscribing from message.')
    await unsubscribeFromTopic(messageDecision.unsubscribeFrom)
  }

  if (
    messageDecision.subscribeTo !== null &&
    messageDecision.respondTo === null &&
    messageDecision.subscribeTo.messageType === MessageSubscribers.broadcastMessage
  ) {
    serverLogger.debug('Subscribing to new topic', messageDecision.subscribeTo.topic)
    await subscribeToBroadcast(
      messageDecision.subscribeTo.topic,
      messageDecision.subscribeTo.password,
      entity
    )
    // The situation never exists where you want to subscribe to a direct message without also sending a message
  }

  let boss_instance = await boss
  if (messageDecision.subscribeTo === null && messageDecision.respondTo !== null) {
    switch (messageDecision.respondTo.messageType) {
      case MessageSubscribers.broadcastMessage:
        await boss_instance.publish('whisper-broadcast-message', {
          message: messageDecision.respondWith,
          topic: messageDecision.respondTo.topic,
          password: messageDecision.respondTo.password,
          replyToTopic: null,
        })
        break
      case MessageSubscribers.directMessage:
        await boss_instance.publish('whisper-direct-message', {
          message: messageDecision.respondWith,
          topic: messageDecision.respondTo.topic,
          publicKey: messageDecision.respondTo.publicKey,
          replyToTopic: null,
        })
        break
      default:
        break
    }
  } else if (
    messageDecision.subscribeTo !== null &&
    messageDecision.respondTo !== null &&
    messageDecision.subscribeTo.messageType === MessageSubscribers.directMessage
  ) {
    switch (messageDecision.respondTo.messageType) {
      case MessageSubscribers.broadcastMessage:
        await boss_instance.publish('whisper-subscribe-then-broadcast', {
          entity: entity,
          message: messageDecision.respondWith,
          topic: messageDecision.respondTo.topic,
          password: messageDecision.respondTo.password,
          replyToTopic: messageDecision.subscribeTo.topic,
        })
        break
      case MessageSubscribers.directMessage:
        await boss_instance.publish('whisper-subscribe-then-direct-message', {
          entity: entity,
          message: messageDecision.respondWith,
          topic: messageDecision.respondTo.topic,
          publicKey: messageDecision.respondTo.publicKey,
          replyToTopic: messageDecision.subscribeTo.topic,
        })
        break
      default:
        break
    }
    // The situation does not currently exist where you subscribe to a broadcast and also send a message
  }
}

const actOnMessages = (messageDecisions: IMessageDecision[], entity: string) => {
  messageDecisions.forEach(async (item: IMessageDecision, index, object) => {
    object.splice(index, 1)
    try {
      await actOnMessage(item, entity)
    } catch (error) {
      newrelic.recordCustomEvent('WhisperError', {
        Stage: 'ActOnMessages',
        Entity: entity,
      })
      serverLogger.warn('Encountered an error while acting on whisper messages', {
        item,
        entity,
        error,
      })
    }
  })
}

export const handleMessages = async (
  entity: TWhisperEntity,
  wallet: Wallet.Wallet
) => {
  // Make sure attester is listening for solicitations
  let newMessages: Shh.Message[] = await fetchAllMessages(entity)
  let messageDecisions: IMessageDecision[] = []
  const web3 = new Web3(new Web3.providers.HttpProvider(env.web3Provider))
  for (let message of newMessages) {
    try {
      try {
        serverLogger.info('Attempting to handle Whisper message', message.payload)
        serverLogger.info('Decoding Whisper message', web3.toAscii(message.payload))
      } catch {
        serverLogger.info('Failed to decode payload')
      }
      const body: TBloomMessage = JSON.parse(web3.toAscii(message.payload))
      serverLogger.info('Decoded Whisper message...', body)
      const messageTopic: string = message.topic
      const messageDecision = await handleMessage(body, messageTopic, entity, wallet)
      serverLogger.info('Received message decision', messageDecision)
      if (messageDecision) {
        messageDecisions.push(messageDecision)
      }
    } catch (error) {
      newrelic.recordCustomEvent('WhisperError', {
        Stage: 'HandleMessages',
        Entity: entity,
      })
      serverLogger.warn(
        'Encountered an error while handling whisper messages',
        error.message,
        error.stack
      )
    }
  }
  await actOnMessages(messageDecisions, entity)
}
