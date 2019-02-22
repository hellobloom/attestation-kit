import {toBuffer} from 'ethereumjs-util'
import {WhisperFilters} from '@shared/models'
import {boss} from '@shared/jobs/boss'
import {env, getJobConfig} from '@shared/environment'

let envPr = env()

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
  let e = await envPr
  const filter = await WhisperFilters.findOne({
    where: {topic: toBuffer(topic)},
    logging: e.logs.whisper.sql,
  })
  if (filter !== null) {
    const filterIDToRemove = filter.filterId
    const keypairId = filter.keypairId
    // Enqueue job to delete filter and keypair
    let boss_instance = await boss
    await boss_instance.publish(
      'whisper-end-session',
      {
        filterId: filterIDToRemove,
        keypairId: keypairId,
      },
      await getJobConfig('whisperEndSession')
    )
  }
}

export const subscribeToBroadcast = async (
  topic: string,
  password: string,
  entity: string
) => {
  let boss_instance = await boss
  await boss_instance.publish(
    'whisper-new-broadcast-session',
    {
      newTopic: topic,
      entity: entity,
      password: password,
    },
    await getJobConfig('whisperNewBroadcastSession')
  )
}
