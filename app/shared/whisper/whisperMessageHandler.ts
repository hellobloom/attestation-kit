import * as newrelic from 'newrelic'
import {
  TPersistData,
  storeSolicitation,
  storeAttestationBid,
  storeAwaitSubjectData,
  storeSendJobDetails,
  storeStartAttestation,
  PersistDataTypes,
} from '@shared/attestations/whisperPersistDataHandler'
import {
  TBloomMessage,
  MessageTypes,
  IBloomWhisperMessage,
} from '@shared/attestations/whisperMessageTypes'
import * as Shh from 'web3-shh'
import * as Web3 from 'web3'
import * as Wallet from 'ethereumjs-wallet'
import {env} from '@shared/environment'
import {fetchAllMessages} from '@shared/attestations/whisper'
import {
  handleSolicitation,
  handleJobDetails,
} from '@shared/attestations/whisperAttesterActions'
import {handleAttestationBid} from '@shared/attestations/whisperRequesterActions'
import {
  MessageSubscriber,
  unsubscribeFromTopic,
  MessageSubscribers,
  subscribeToBroadcast,
} from '@shared/attestations/whisperSubscriptionHandler'
import {serverLogger} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import {
  TExternalAction,
  ExternalActionTypes,
  collectSubjectData,
  performAttestation,
} from '@shared/attestations/whisperExternalActionHandler'
import {confirmRequesterFunds} from '@shared/attestations/whisperValidateMessage'

export enum Entities {
  requester = 'Requester',
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
}

export const AttestationTypeToEntity = {
  requester: Entities.requester,
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
}

export type TMessageHandler = (...args: any[]) => Promise<IMessageDecision | false>

export interface IMessageDecision {
  unsubscribeFrom: string | null // Topic recovered from message
  subscribeTo: MessageSubscriber | null
  respondTo: MessageSubscriber | null
  respondWith: TBloomMessage | null
  persist: TPersistData | null
  externalAction: TExternalAction | null
}

const handleUnknownMessageType: TMessageHandler = async (
  message: IBloomWhisperMessage,
  messageTopic: string
) => {
  const decision: IMessageDecision = {
    unsubscribeFrom: null,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: null,
    externalAction: null,
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
  serverLogger.debug('Handling message', body)
  let messageDecision: IMessageDecision | false
  if (body.hasOwnProperty('messageType')) {
    switch (body.messageType) {
      case MessageTypes.solicitation:
        // this check is here to make handleSolicitation testable
        // confirmRequesterFunds performs a blockchain state read
        serverLogger.debug('Handling solicitation message')
        let confirmed = await confirmRequesterFunds(body)
        if (confirmed) {
          messageDecision = await handleSolicitation(body, messageTopic, wallet)
        } else {
          messageDecision = await handleUnknownMessageType(body, messageTopic)
        }
        if (!messageDecision) {
          return false
        }
        break
      case MessageTypes.attestationBid:
        serverLogger.debug('Handling attestation message')
        messageDecision = await handleAttestationBid(body, messageTopic, wallet)
        break
      case MessageTypes.sendJobDetails:
        serverLogger.debug('Handling sendJobDetails message')
        messageDecision = await handleJobDetails(body, messageTopic, wallet)
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
      case PersistDataTypes.storeAwaitSubjectData:
        serverLogger.debug('Acting on message, storeAwaitSubjectData')
        await storeAwaitSubjectData(messageDecision.persist)
        break
      case PersistDataTypes.storeSendJobDetails:
        serverLogger.debug('Acting on message, storeSendJobDetails')
        await storeSendJobDetails(messageDecision.persist)
        break
      case PersistDataTypes.storeStartAttestation:
        serverLogger.debug('Acting on message, storeStartAttestation')
        await storeStartAttestation(messageDecision.persist)
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

  if (messageDecision.externalAction !== null) {
    switch (messageDecision.externalAction.actionType) {
      case ExternalActionTypes.awaitSubjectData:
        await collectSubjectData(messageDecision.externalAction)
        break
      case ExternalActionTypes.performAttestation:
        await performAttestation(messageDecision.externalAction)
        break
      default:
        break
    }
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
        error,
      })
    }
  })
}

export const handleMessages = async (entity: string, wallet: Wallet.Wallet) => {
  // Make sure attester is listening for solicitations
  let newMessages: Shh.Message[] = await fetchAllMessages(entity)
  let messageDecisions: IMessageDecision[] = []
  const web3 = new Web3(new Web3.providers.HttpProvider(env.web3Provider))
  for (let message of newMessages) {
    try {
      try {
        serverLogger.info('Attempting to handle Whisper message', message.payload)
        serverLogger.info('Decoding Whisper message', web3.toAscii(message.payload))
      } catch {}
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
