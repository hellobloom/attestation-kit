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
import {fetchAllMessages, TWhisperEntity} from '@shared/whisper'
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
import {log} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import {confirmRequesterFunds} from '@shared/whisper/validateMsg'

let envPr = env()
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
  log(`${date}[handleMessage] ${JSON.stringify(body)}`, {level: 'debug'})
  log(`${date}[handleMessage] body.messageType = ${body.messageType}`, {
    level: 'debug',
  })
  let messageDecision: IMessageDecision | false
  if (body.hasOwnProperty('messageType')) {
    switch (body.messageType) {
      case EMsgTypes.solicitation:
        // this check is here to make handleSolicitation testable
        // confirmRequesterFunds performs a blockchain state read
        log('Handling solicitation message', {level: 'debug'})
        let confirmed = await confirmRequesterFunds(body)
        log(`Requester funds? ${confirmed}`)
        if (confirmed) {
          messageDecision = await handleSolicitation(body, messageTopic, wallet)
          log(
            `Requester funds check succeeded.  Message decision: ${messageDecision}`
          )
        } else {
          messageDecision = await handleUnknownMessageType(body, messageTopic)
          log(`Requester funds check failed.  Message decision: ${messageDecision}`)
        }
        if (!messageDecision) {
          return false
        }
        break
      case EMsgTypes.attestationBid:
        log('Handling attestation message', {level: 'debug'})
        messageDecision = await handleAttestationBid(body, messageTopic, wallet)
        break
      case EMsgTypes.paymentAuthorization:
        log('Handling handlePaymentAuthorization message')
        messageDecision = await handlePaymentAuthorization(
          body,
          messageTopic,
          wallet
        )
        break
      default:
        log('Handling unknown message', {level: 'debug'})
        messageDecision = await handleUnknownMessageType(body, messageTopic)
    }
  } else {
    log('Handling unknown message (no type specified)', {level: 'debug'})
    messageDecision = await handleUnknownMessageType(body, messageTopic)
  }
  log(`Message decision: ${JSON.stringify(messageDecision)}`, {level: 'debug'})
  return messageDecision
}

export const actOnMessage = async (
  messageDecision: IMessageDecision,
  entity: string
) => {
  log('DEBUG [actOnMessage] ' + JSON.stringify({messageDecision, entity}))
  if (messageDecision.persist !== null) {
    switch (messageDecision.persist.messageType) {
      case PersistDataTypes.storeSolicitation:
        log('Acting on message, storeSolicitation', {level: 'debug'})
        await storeSolicitation(messageDecision.persist)
        break
      case PersistDataTypes.storeAttestationBid:
        log('Acting on message, storeAttestationBid', {level: 'debug'})
        await storeAttestationBid(messageDecision.persist)
        break
      case PersistDataTypes.storeSendPaymentAuthorization:
        log('Acting on message, storeSendPaymentAuthorization', {level: 'debug'})
        await storeSendPaymentAuthorization(messageDecision.persist)
        break
      default:
        break
    }
  }
  log('Message acted upon', {level: 'debug'})
  if (messageDecision.unsubscribeFrom !== null) {
    log('Unsubscribing from message.', {level: 'debug'})
    await unsubscribeFromTopic(messageDecision.unsubscribeFrom)
  }

  if (
    messageDecision.subscribeTo !== null &&
    messageDecision.respondTo === null &&
    messageDecision.subscribeTo.messageType === MessageSubscribers.broadcastMessage
  ) {
    log(['Subscribing to new topic', messageDecision.subscribeTo.topic], {
      level: 'debug',
    })
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
      log(
        [
          'Encountered an error while acting on whisper messages',
          {
            item,
            entity,
            error,
          },
        ],
        {level: 'warn'}
      )
    }
  })
}

export const handleMessages = async (
  entity: TWhisperEntity,
  wallet: Wallet.Wallet
) => {
  let e = await envPr
  // Make sure attester is listening for solicitations
  let newMessages: Shh.Message[] = await fetchAllMessages(entity)
  let messageDecisions: IMessageDecision[] = []
  const web3 = new Web3(new Web3.providers.HttpProvider(e.web3Provider))
  for (let message of newMessages) {
    try {
      try {
        log(['Attempting to handle Whisper message', message.payload])
        log(['Decoding Whisper message', web3.toAscii(message.payload)])
      } catch {
        log('Failed to decode payload')
      }
      const body: TBloomMessage = JSON.parse(web3.toAscii(message.payload))
      log(['Decoded Whisper message...', body])
      const messageTopic: string = message.topic
      const messageDecision = await handleMessage(body, messageTopic, entity, wallet)
      log(['Received message decision', messageDecision])
      if (messageDecision) {
        messageDecisions.push(messageDecision)
      }
    } catch (error) {
      newrelic.recordCustomEvent('WhisperError', {
        Stage: 'HandleMessages',
        Entity: entity,
      })
      log(
        [
          'Encountered an error while handling whisper messages',
          error.message,
          error.stack,
        ],
        {level: 'warn'}
      )
    }
  }
  await actOnMessages(messageDecisions, entity)
}
