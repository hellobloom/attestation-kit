import {boss} from '@shared/jobs/boss'
import * as Sentry from '@sentry/node'
import {env} from '@shared/environment'
import {log} from '@shared/logger'
import '@worker/batch'

import {submitAttestation} from '@worker/jobs/submit-attestation'
import {whisperBroadcastMessage} from '@worker/jobs/whisper-broadcast-message'
import {whisperDirectMessage} from '@worker/jobs/whisper-direct-message'
import {whisperEndSession} from '@worker/jobs/whisper-end-session'
import {whisperNewBroadcastSession} from '@worker/jobs/whisper-new-broadcast-session'
import {whisperSubscribeThenBroadcast} from '@worker/jobs/whisper-subscribe-then-broadcast'
import {whisperSubscribeThenDirectMessage} from '@worker/jobs/whisper-subscribe-then-direct-message'

log('Starting job worker...')

const onError = (error: Error) => {
  // Failsafe log
  console.log('Error encountered in job worker', error)

  log(error, {
    full: true,
    tags: {logger: 'unhandled_job_error'},
  })
}

let envPr = env()

envPr
  .then(e => {
    Sentry.init({
      dsn: e.sentryDSN,
      environment: e.pipelineStage,
      release: e.sourceVersion,
    })

    boss.then(ready).catch(onError)

    function ready(b: any) {
      console.log('PgBoss ready, connecting to jobs...')
      b.on('error', onError)

      const jobs = {
        'submit-attestation': submitAttestation,
        'whisper-broadcast-message': whisperBroadcastMessage,
        'whisper-direct-message': whisperDirectMessage,
        'whisper-end-session': whisperEndSession,
        'whisper-new-broadcast-session': whisperNewBroadcastSession,
        'whisper-subscribe-then-broadcast': whisperSubscribeThenBroadcast,
        'whisper-subscribe-then-direct-message': whisperSubscribeThenDirectMessage,
      }

      Object.keys(jobs).forEach((key: string) => {
        b.subscribe(key, jobs[key])
          .then(() => log('Subscribed to ' + key))
          .catch(onError)
      })
    }
  })
  .catch(onError)
