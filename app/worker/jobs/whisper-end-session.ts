import {log} from '@shared/logger'

import {endSession} from '@shared/whisper'

export const whisperEndSession = async (job: any) => {
  try {
    await endSession(job.data.filterId, job.data.keypairId)
  } catch (e) {
    log(
      {
        name: 'WhisperError',
        event: {
          Action: 'EndSession',
          FilterId: job.data.filterId,
        },
      },
      {event: true}
    )
    throw new Error(e)
  }
}
