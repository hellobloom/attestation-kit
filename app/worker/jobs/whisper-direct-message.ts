import {resetShh, directMessage} from '@shared/whisper'
import {log} from '@shared/logger'

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
    log(
      {
        name: 'WhisperError',
        event: {
          Action: 'BroadcastMessage',
          Topic: job.data.topic,
        },
      },
      {event: true}
    )
    throw new Error(e)
  }
}
