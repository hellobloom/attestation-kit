import {boss} from '@shared/jobs/boss'
import {log} from '@shared/logger'

import {resetShh, newDirectMessageSession} from '@shared/whisper'

export const whisperSubscribeThenDirectMessage = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    await resetShh()
    await newDirectMessageSession(job.data.replyToTopic, job.data.entity)
    let boss_instance = await boss
    await boss_instance.publish('whisper-direct-message', {
      message: job.data.message,
      topic: job.data.topic,
      publicKey: job.data.publicKey,
      replyToTopic: job.data.replyToTopic,
    })
  } catch (e) {
    log(
      {
        name: 'WhisperError',
        event: {
          Action: 'SubscribeThenDirectMessage',
          Topic: job.data.topic,
        },
      },
      {event: true}
    )
    throw new Error(e)
  }
}
