import {env} from '@shared/environment'
import {loadAttestationLogic} from '@shared/contracts/load'
import {serverLogger} from '@shared/logger'
import {IAttestParams} from '@shared/attestations/validateAttestParams'
import * as account from '@shared/ethereum/account'
import BigNumber from 'bignumber.js'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

const attestationLogic = loadAttestationLogic(
  env.attestationContracts.logicAddress
).withProvider(privateEngine(env.owner.ethPrivKey, {stage: 'testnet'}))

export const sendAttestTx = async (
  attestationParams: IAttestParams,
  gasPrice: string
) => {
  serverLogger.info(`Sending attest transaction for ${attestationParams.subject}`)
  serverLogger.debug(
    `[sendAttestTx] attestationParams: ${JSON.stringify(attestationParams)}`
  )
  serverLogger.debug(`[sendAttestTx] gasPrice: ${gasPrice}`)
  serverLogger.debug(
    `[sendAttestTx] attest transaction options: ${JSON.stringify({
      from: account.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    })}`
  )

  const txHash = await attestationLogic.attest.sendTransaction(
    attestationParams.subject,
    attestationParams.requester,
    attestationParams.reward,
    attestationParams.requesterSig,
    attestationParams.dataHash,
    attestationParams.requestNonce,
    attestationParams.subjectSig,
    {
      from: account.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    }
  )
  serverLogger.debug(`[sendAttestTx] txHash: ${txHash}`)
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
