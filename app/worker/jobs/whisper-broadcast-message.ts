import * as newrelic from 'newrelic'
import {log} from '@shared/logger'

import {resetShh, broadcastMessage} from '@shared/whisper'

export const whisperBroadcastMessage = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    resetShh()
    log('Broadcasting message...')
    await broadcastMessage(
      job.data.message,
      job.data.topic,
      job.data.password,
      job.data.replyToTopic
    )
  } catch (e) {
    newrelic.recordCustomEvent('WhisperError', {
      Action: 'BroadcastMessage',
      Topic: job.data.topic,
    })
    log('Error broadcasting message', {level: 'error'})
    throw new Error(e)
  }
}
