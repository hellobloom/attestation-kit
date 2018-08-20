import * as newrelic from 'newrelic'
import {resetShh, newBroadcastSession} from '@shared/attestations/whisper'

export const whisperNewBroadcastSession = async (job: any) => {
  try {
    resetShh()
    await newBroadcastSession(job.data.newTopic, job.data.password, job.data.entity)
  } catch (e) {
    newrelic.recordCustomEvent('WhisperError', {
      Action: 'NewBroadcastSession',
      Topic: job.data.newTopic,
    })
    throw new Error(e)
  }
}
