import {boss} from '@shared/jobs/boss'
import * as newrelic from 'newrelic'
import {env} from '@shared/environment'
import * as Raven from 'raven'
import {serverLogger} from '@shared/logger'

Raven.config(env.sentryDSN, {environment: env.nodeEnv}).install()

import {submitAttestation} from '@worker/jobs/submit-attestation'
import {whisperBroadcastMessage} from '@worker/jobs/whisper-broadcast-message'
import {whisperDirectMessage} from '@worker/jobs/whisper-direct-message'
import {whisperEndSession} from '@worker/jobs/whisper-end-session'
import {whisperNewBroadcastSession} from '@worker/jobs/whisper-new-broadcast-session'
import {whisperSubscribeThenBroadcast} from '@worker/jobs/whisper-subscribe-then-broadcast'
import {whisperSubscribeThenDirectMessage} from '@worker/jobs/whisper-subscribe-then-direct-message'

boss.then(ready).catch(onError)

function ready(boss: any) {
  boss.on('error', onError)

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
    boss
      .subscribe(key, jobs[key])
      .then(() => serverLogger.info('Subscribed to ' + key))
      .catch(onError)
  })
}

function onError(error: Error) {
  newrelic.noticeError(error, {
    message: 'Unhandled job error',
  })
  Raven.captureException(error, {
    tags: {logger: 'unhandled_job_error'},
  })
}
