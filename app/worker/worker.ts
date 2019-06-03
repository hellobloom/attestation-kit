import {boss} from '@shared/jobs/boss'
import * as Sentry from '@sentry/node'
import {env} from '@shared/environment'
import {log} from '@shared/logger'

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

import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { HashingLogic } from '@bloomprotocol/attestations-lib';

const timeout = 10000

async function sleep(miliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, miliseconds))
}

class LoopThrottler {
  public lastStartTime: number = Date.now()

  constructor(public minLoopTimeMs: number) {}

  public async wait() {
    const loopTime = Date.now() - this.lastStartTime
    const remainingTime = this.minLoopTimeMs - loopTime
    if (remainingTime > 0) await sleep(remainingTime)
    this.lastStartTime = Date.now()
  }
}

(async function main() {
  await sleep(timeout)
  const outerLoop = new LoopThrottler(timeout)

  while (true) {
    try {
      const hashes = await BatchQueue.process()

      if(hashes.length > 0) {
        const merkleTree = HashingLogic.getMerkleTreeFromLeaves(hashes)
        // TODO Submit transaction to tx-service
        await BatchQueue.finish(hashes, merkleTree.getRoot())
      }
    } catch (err) {
      await onError(err)
    }
    await outerLoop.wait()
  }
})().catch(onError)
