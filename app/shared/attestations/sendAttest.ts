import {env} from '@shared/environment'
import {loadAttestationLogic} from '@shared/contracts/load'
import {log} from '@shared/logger'
import {IAttestParams} from '@shared/attestations/validateAttestParams'
import * as account from '@shared/ethereum/account'
import BigNumber from 'bignumber.js'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

let envPr = env()

const attestationLogic = envPr.then(async e =>
  loadAttestationLogic(e.attestationContracts.logicAddress).withProvider(
    await privateEngine(e.owner.ethPrivKey, {stage: 'testnet'})
  )
)

export const sendAttestTx = async (
  attestationParams: IAttestParams,
  gasPrice: string
) => {
  log(`Sending attest transaction for ${attestationParams.subject}`)
  log(`[sendAttestTx] attestationParams: ${JSON.stringify(attestationParams)}`, {
    level: 'debug',
  })
  log(`[sendAttestTx] gasPrice: ${gasPrice}`, {level: 'debug'})
  log(
    `[sendAttestTx] attest transaction options: ${JSON.stringify({
      from: account.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    })}`,
    {level: 'debug'}
  )

  const al = await attestationLogic
  let ac = await account
  const txHash = await al.attest.sendTransaction(
    attestationParams.subject,
    attestationParams.requester,
    attestationParams.reward,
    attestationParams.requesterSig,
    attestationParams.dataHash,
    attestationParams.requestNonce,
    attestationParams.subjectSig,
    {
      from: await ac.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    }
  )
  log(`[sendAttestTx] txHash: ${txHash}`, {level: 'debug'})
  return txHash
}

export type TSendAttestParams = {
  subject: string
  requester: string
  reward: BigNumber
  requesterSig: string
  dataHash: string
  requestNonce: string
  subjectSig: string
}
