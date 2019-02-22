import {boss} from '@shared/jobs/boss'
import {log} from '@shared/logger'
import {getJobConfig} from '@shared/environment'
import {resetShh, newDirectMessageSession} from '@shared/whisper'

export const whisperSubscribeThenBroadcast = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    await resetShh()
    await newDirectMessageSession(job.data.replyToTopic, job.data.entity)
    let boss_instance = await boss
    await boss_instance.publish(
      'whisper-broadcast-message',
      {
        message: job.data.message,
        topic: job.data.topic,
        password: job.data.password,
        replyToTopic: job.data.replyToTopic,
      },
      await getJobConfig('whisperBroadcastMessage')
    )
  } catch (e) {
    log(
      {
        name: 'WhisperError',
        event: {
          Action: 'SubscribeThenBroadcast',
          Topic: job.data.topic,
        },
      },
      {event: true}
    )
    throw new Error(e)
  }
}
