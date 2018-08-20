import * as Web3 from 'web3'
import * as Shh from 'web3-shh'
import {env} from '@shared/environment'
import {WhisperFilters} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {IBloomWhisperMessage} from '@shared/attestations/whisperMessageTypes'
import {serverLogger} from '@shared/logger'

export const web3 = new Web3(new Web3.providers.HttpProvider(env.web3Provider))
export const toTopic = (ascii: string) => web3.sha3(ascii).slice(0, 10)
export var shh = new Shh(env.whisper.provider)

export const resetShh = () => {
  shh = new Shh(env.whisper.provider)
}

export const fetchAllMessages = async (entity: string) => {
  const filters = await WhisperFilters.findAll({where: {entity: entity}})
  let allMessages: Shh.Message[] = []
  for (let filter of filters) {
    try {
      let filterMessages = await shh.getFilterMessages(filter.filterId)
      for (let message of filterMessages) {
        allMessages.push(message)
      }
    } catch {
      // If getting messages fails, the filter probably timed out. delete it
      await filter.destroy()
    }
  }
  return allMessages
}

export const broadcastMessage = async (
  message: IBloomWhisperMessage,
  messageTopic: string,
  symKeyPassword: string,
  replyToTopic: string | null
) => {
  try {
    serverLogger.debug('Broadcasting message on whisper:', message.messageType)
    // Generate symkey from password
    const symkeyId = await shh.generateSymKeyFromPassword(symKeyPassword)
    // Look up public key associated with this topic
    if (replyToTopic !== null) {
      const filter = await WhisperFilters.findOne({
        where: {topic: toBuffer(replyToTopic)},
      })
      if (filter !== null) {
        const keypairId = filter.keypairId
        message.replyTo = await shh.getPublicKey(keypairId)
      }
    }
    const outcome = await shh.post({
      ttl: 7,
      topic: messageTopic,
      powTarget: 2.01,
      powTime: 2,
      payload: web3.fromAscii(JSON.stringify(message)),
      symKeyID: symkeyId,
    })
    if (!outcome) {
      throw new Error('Failed to broadcast message')
    }
  } catch (err) {
    throw err
  }
}

export const directMessage = async (
  message: IBloomWhisperMessage,
  messageTopic: string,
  recipientPublicKeyString: string,
  replyToTopic: string | null
) => {
  try {
    // Look up public key associated with this topic
    if (replyToTopic !== null) {
      const filter = await WhisperFilters.findOne({
        where: {topic: toBuffer(replyToTopic)},
      })
      if (filter !== null) {
        const keypairId = filter.keypairId
        message.replyTo = await shh.getPublicKey(keypairId)
      }
    }
    serverLogger.info('Sending direct message', message)
    const outcome = await shh.post({
      ttl: 7,
      topic: messageTopic,
      powTarget: 2.01,
      powTime: 2,
      payload: web3.fromAscii(JSON.stringify(message)),
      pubKey: recipientPublicKeyString,
    })
    if (!outcome) {
      throw new Error('Failed to send direct message')
    }
  } catch (e) {
    throw new Error(`Failed to send direct message: ${e}`)
  }
}

export const newBroadcastSession = async (
  newTopic: string,
  password: string,
  entity: string
) => {
  try {
    const symkeyId = await shh.generateSymKeyFromPassword(password)
    // Don't create duplicate filters for the same entity
    const filter = await WhisperFilters.findOne({
      where: {topic: toBuffer(newTopic), entity: entity},
    })
    if (filter !== null) {
      // Try to delete the filter. No way to just check if it works
      const filterIdToRemove = filter.filterId
      await filter.destroy()
      await shh.deleteMessageFilter(filterIdToRemove)
    }
    const broadcastMessageFilterID = await shh.newMessageFilter({
      topics: [newTopic],
      symKeyID: symkeyId,
    })
    await WhisperFilters.create({
      entity: entity,
      filterId: broadcastMessageFilterID,
      topic: toBuffer(newTopic),
    })
  } catch (e) {
    throw new Error(`Broadcast filter message addition failed: ${e}`)
  }
}

export const newDirectMessageSession = async (newTopic: string, entity: string) => {
  try {
    const newKeyID = await shh.newKeyPair()
    // Don't create duplicate filters for the same entity
    const filter = await WhisperFilters.findOne({
      where: {topic: toBuffer(newTopic), entity: entity},
    })
    if (filter !== null) {
      // Try to delete the filter. No way to just check if it works
      const filterIdToRemove = filter.filterId
      const keypairIdToRemove = filter.keypairId
      await filter.destroy()
      await shh.deleteMessageFilter(filterIdToRemove)
      await shh.deleteKeyPair(keypairIdToRemove)
    }
    const directMessageFilterID = await shh.newMessageFilter({
      topics: [newTopic],
      privateKeyID: newKeyID,
    })
    await WhisperFilters.create({
      entity: entity,
      filterId: directMessageFilterID,
      topic: toBuffer(newTopic),
      keypairId: newKeyID,
    })
  } catch (e) {
    throw new Error(`Direct message filter addition failed: ${e}`)
  }
}

export const endSession = async (filterId: string, keypairId: string) => {
  try {
    const filter = await WhisperFilters.findOne({
      where: {filterId: filterId},
    })
    if (filter !== null) {
      const filterIdToRemove = filter.filterId
      const keypairIdToRemove = filter.keypairId
      await filter.destroy()
      await shh.deleteMessageFilter(filterIdToRemove)
      await shh.deleteKeyPair(keypairIdToRemove)
    }
  } catch (e) {
    throw new Error(`Filter removal failed: ${e}`)
  }
}
