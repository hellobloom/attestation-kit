import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { HashingLogic } from '@bloomprotocol/attestations-lib'
import { log } from '@shared/logger'
import { sendTx } from '@shared/txService';
import { env, TNetworks } from '@shared/environment';

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
  const loopTimer = new LoopThrottler(timeout)

  const e = await env()
  let network: TNetworks
  if(['development', 'test', 'ci'].indexOf(e.pipelineStage!) !== -1) network = 'local'
  else if(e.pipelineStage === 'staging') network = 'rinkeby'
  else if(e.pipelineStage === 'production') network = 'mainnet'
  else throw new Error(`pipeline stage "${e.pipelineStage}" not supported`)

  while (true) {
    try {
      const hashes = await BatchQueue.process()

      if(hashes.length > 0) {
        const merkleTree = HashingLogic.getMerkleTreeFromLeaves(hashes)
        const response = await sendTx({
          tx: {
            network,
            contract_name: 'BatchAttestationLogic',
            method: 'batchAttest',
            args: {dataHash: `0x${merkleTree.getRoot().toString('hex')}`},
          },
        })
        
        if(response) {
          if(!response.ok) throw new Error(`Recieved status ${response.status} from ts-service`)
          await BatchQueue.finish(hashes, merkleTree.getRoot())
        }
      }
    } catch (err) {
      await onError(err)
    }
    await loopTimer.wait()
  }
})().catch(onError)
