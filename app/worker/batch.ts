import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import {log} from '@shared/logger'
import {sendTx} from '@shared/txService'
import {env, TNetworks} from '@shared/environment'

// TODO make into env var
const timeout = 3600000

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

const main = async () => {
  const e = await env()
  await sleep(e.batchTimeout || timeout)
  const loopTimer = new LoopThrottler(e.batchTimeout || timeout)

  let network: TNetworks
  if (['development', 'test', 'ci'].indexOf(e.pipelineStage!) !== -1) {
    network = 'local'
  } else if (e.pipelineStage === 'staging') network = 'rinkeby'
  else if (e.pipelineStage === 'production') network = 'mainnet'
  else throw new Error(`pipeline stage "${e.pipelineStage}" not supported`)

  while (true) {
    try {
      await loopTimer.wait()

      if (!e.txService) continue

      if (!e.attester) {
        throw new Error(
          'attester must be specified in env if txService is to be used'
        )
      }

      const hashes = await BatchQueue.process()

      if (hashes.length > 0) {
        console.log(
          `DEBUG AKB: Sending batch with ${JSON.stringify(hashes.length)} hashes`
        )
        const merkleTree = HashingLogic.getMerkleTreeFromLeaves(hashes)

        const response = await sendTx({
          tx: {
            network,
            contract_name: 'BatchAttestationLogic',
            method: 'batchAttest',
            args: {dataHash: `0x${merkleTree.getRoot().toString('hex')}`},
          },
          webhook: {
            mined: true,
            address: e.attester.address,
            key: e.attester.key,
          },
        })

        if (response) {
          if (!response.ok) {
            throw new Error(`Recieved status ${response.status} from ts-service`)
          }
          const body = await response.json()
          if (typeof body.tx.id !== 'number') {
            throw new Error('expected tx.id from txService')
          }
          await BatchQueue.finish(hashes, merkleTree.getRoot(), body.tx.id)
        }
      } else {
        console.log(`DEBUG AKB: Zero hashes, not sending batch`)
      }
    } catch (err) {
      await onError(err)
    }
  }
}

main().catch(onError)
