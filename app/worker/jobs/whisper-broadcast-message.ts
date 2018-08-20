import * as newrelic from 'newrelic'
import {serverLogger} from '@shared/logger'

import {resetShh, broadcastMessage} from '@shared/attestations/whisper'

export const whisperBroadcastMessage = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    resetShh()
    serverLogger.info('Broadcasting message...')
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
    serverLogger.error('Error broadcasting message')
    throw new Error(e)
  }
}
