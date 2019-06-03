import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { HashingLogic } from '@bloomprotocol/attestations-lib'
import { log } from '@shared/logger'

const timeout = 10000

const onError = (error: Error) => {
  // Failsafe log
  console.log('Error encountered in job worker', error)

  log(error, {
    full: true,
    tags: {logger: 'unhandled_job_error'},
  })
}

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
