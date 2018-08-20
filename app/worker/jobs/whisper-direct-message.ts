import * as newrelic from 'newrelic'

import {resetShh, directMessage} from '@shared/attestations/whisper'

export const whisperDirectMessage = async (job: any) => {
  if (job.data.message === null) {
    return
  }
  try {
    resetShh()

    await directMessage(
      job.data.message,
      job.data.topic,
      job.data.publicKey,
      job.data.replyToTopic
    )
  } catch (e) {
    newrelic.recordCustomEvent('WhisperError', {
      Action: 'BroadcastMessage',
      Topic: job.data.topic,
    })
    throw new Error(e)
  }
}
