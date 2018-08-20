import * as newrelic from 'newrelic'
import {boss} from '@shared/jobs/boss'

import {resetShh, newDirectMessageSession} from '@shared/attestations/whisper'

export const whisperSubscribeThenBroadcast = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    resetShh()
    await newDirectMessageSession(job.data.replyToTopic, job.data.entity)
    let boss_instance = await boss
    await boss_instance.publish('whisper-broadcast-message', {
      message: job.data.message,
      topic: job.data.topic,
      password: job.data.password,
      replyToTopic: job.data.replyToTopic,
    })
  } catch (e) {
    newrelic.recordCustomEvent('WhisperError', {
      Action: 'SubscribeThenBroadcast',
      Topic: job.data.topic,
    })
    throw new Error(e)
  }
}
