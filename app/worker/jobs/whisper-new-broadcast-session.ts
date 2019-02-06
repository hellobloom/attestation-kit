import {resetShh, newBroadcastSession} from '@shared/whisper'
import {log} from '@shared/logger'

export const whisperNewBroadcastSession = async (job: any) => {
  try {
    resetShh()
    await newBroadcastSession(job.data.newTopic, job.data.password, job.data.entity)
  } catch (e) {
    log(
      {
        name: 'WhisperError',
        event: {
          Action: 'NewBroadcastSession',
          Topic: job.data.newTopic,
        },
      },
      {event: true}
    )
    throw new Error(e)
  }
}
