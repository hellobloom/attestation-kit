import * as newrelic from 'newrelic'

import {endSession} from '@shared/attestations/whisper'

export const whisperEndSession = async (job: any) => {
  try {
    await endSession(job.data.filterId, job.data.keypairId)
  } catch (e) {
    newrelic.recordCustomEvent('WhisperError', {
      Action: 'EndSession',
      FilterId: job.data.filterId,
    })
    throw new Error(e)
  }
}
