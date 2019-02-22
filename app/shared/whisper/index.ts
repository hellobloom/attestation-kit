import * as Web3 from 'web3'
import * as Shh from 'web3-shh'
import {env, getProvider} from '@shared/environment'
import {WhisperFilters} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {IBloomWhisperMessage} from '@shared/whisper/msgTypes'
import {log} from '@shared/logger'
import {AttestationTypeManifest} from '@bloomprotocol/attestations-lib'

let envPr = env()

export type TWhisperEntity = keyof AttestationTypeManifest | 'ping' | 'requester'

var shh: any

void envPr.then(e => {
  shh = new Shh(e.whisper.provider)
})

export const web3Pr = getProvider('mainnet').then(
  p => new Web3(new Web3.providers.HttpProvider(p))
)

export const toTopic = async (ascii: string) => {
  let web3 = await web3Pr
  return web3.sha3(ascii).slice(0, 10)
}

export const getTopic = async (at: TWhisperEntity) => {
  let e = await envPr
  var name = `${e.whisper.topicPrefix}-${at}`
  var camelName = name.replace(/-([a-z])/g, (g: string) => {
    return g[1].toUpperCase()
  })
  return camelName
}

export const resetShh = async () => {
  let e = await envPr
  shh = new Shh(e.whisper.provider)
}

export {shh}

export const fetchAllMessages = async (entity: string) => {
  let e = await envPr
  const filters = await WhisperFilters.findAll({
    where: {entity: entity},
    logging: e.logs.whisper.sql,
  })
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
  let e = await envPr
  try {
    log(['Broadcasting message on whisper:', message.messageType], {level: 'debug'})
    // Generate symkey from password
    const symkeyId = await shh.generateSymKeyFromPassword(symKeyPassword)
    // Look up public key associated with this topic
    if (replyToTopic !== null) {
      const filter = await WhisperFilters.findOne({
        where: {topic: toBuffer(replyToTopic)},
        logging: e.logs.whisper.sql,
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
  let e = await envPr
  try {
    // Look up public key associated with this topic
    if (replyToTopic !== null) {
      const filter = await WhisperFilters.findOne({
        where: {topic: toBuffer(replyToTopic)},
        logging: e.logs.whisper.sql,
      })
      if (filter !== null) {
        const keypairId = filter.keypairId
        message.replyTo = await shh.getPublicKey(keypairId)
      }
    }
    log(`Sending direct message: ${message}`)
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
  let e = await envPr
  try {
    const symkeyId = await shh.generateSymKeyFromPassword(password)
    // Don't create duplicate filters for the same entity
    const filter = await WhisperFilters.findOne({
      where: {topic: toBuffer(newTopic), entity: entity},
      logging: e.logs.whisper.sql,
    })
    if (filter !== null) {
      try {
        // Try to delete the filter. No way to just check if it works
        const filterIdToRemove = filter.filterId
        await filter.destroy()
        await shh.deleteMessageFilter(filterIdToRemove)
      } catch (err) {
        log('Warning: filter removal failed (probably negligible)')
      }
    }
    const broadcastMessageFilterID = await shh.newMessageFilter({
      topics: [newTopic],
      symKeyID: symkeyId,
    })
    const wf = await WhisperFilters.create({
      entity: entity,
      filterId: broadcastMessageFilterID,
      topic: toBuffer(newTopic),
    })
    return wf
  } catch (e) {
    throw new Error(
      `Broadcast filter message addition failed for ${newTopic}, ${entity}: ${e}`
    )
  }
}

export const newDirectMessageSession = async (newTopic: string, entity: string) => {
  let e = await envPr
  try {
    const newKeyID = await shh.newKeyPair()
    // Don't create duplicate filters for the same entity
    const filter = await WhisperFilters.findOne({
      where: {topic: toBuffer(newTopic), entity: entity},
      logging: e.logs.whisper.sql,
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
  let e = await envPr
  try {
    const filter = await WhisperFilters.findOne({
      where: {filterId: filterId},
      logging: e.logs.whisper.sql,
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
