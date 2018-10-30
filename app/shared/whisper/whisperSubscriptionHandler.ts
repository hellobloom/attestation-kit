import {toBuffer} from 'ethereumjs-util'
import {WhisperFilters} from '@shared/models'
import {boss} from '@shared/jobs/boss'

export type MessageSubscriber = IBroadcastSubscriber | IDirectMessageSubscriber

export enum MessageSubscribers {
  broadcastMessage = 'BroadcastMessage',
  directMessage = 'DirectMessage',
}

export interface IBroadcastSubscriber {
  messageType: MessageSubscribers.broadcastMessage
  topic: string
  password: string
}

export interface IDirectMessageSubscriber {
  messageType: MessageSubscribers.directMessage
  topic: string
  publicKey: string
}

export const unsubscribeFromTopic = async (topic: string) => {
  const filter = await WhisperFilters.findOne({
    where: {topic: toBuffer(topic)},
  })
  if (filter !== null) {
    const filterIDToRemove = filter.filterId
    const keypairId = filter.keypairId
    // Enqueue job to delete filter and keypair
    let boss_instance = await boss
    await boss_instance.publish('whisper-end-session', {
      filterId: filterIDToRemove,
      keypairId: keypairId,
    })
  }
}

export const subscribeToBroadcast = async (
  topic: string,
  password: string,
  entity: string
) => {
  let boss_instance = await boss
  await boss_instance.publish('whisper-new-broadcast-session', {
    newTopic: topic,
    entity: entity,
    password: password,
  })
}
