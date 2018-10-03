import {env} from '@shared/environment'
import * as Web3 from 'web3'
import {loadAttestationLogic} from '@shared/contracts/load'
import {serverLogger} from '@shared/logger'
import {IAttestParams} from '@shared/attestations/validateAttestParams'
import * as account from '@shared/ethereum/account'
import BigNumber from 'bignumber.js'
import * as Wallet from 'ethereumjs-wallet'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

const attestationLogic = loadAttestationLogic(
  env.attestationContracts.logicAddress
).withProvider(privateEngine(env.owner.ethPrivKey, {stage: 'testnet'}))

interface IAttestEventArgs {
  attestationId: BigNumber
  subjectId: BigNumber
  attesterId: BigNumber
  requesterId: BigNumber
  dataHash: string
  typeIds: BigNumber[]
  stakeValue: BigNumber
  expiresAt: BigNumber
}

export const sendAttestTx = async (
  attestationParams: IAttestParams,
  attesterWallet: Wallet.Wallet,
  gasPrice: string
) => {
  serverLogger.info(`Sending attest transaction for ${attestationParams.subject}`)
  serverLogger.debug(
    `[sendAttestTx] attestationParams: ${JSON.stringify(attestationParams)}`
  )
  serverLogger.debug(
    `[sendAttestTx] attest transaction options: ${JSON.stringify({
      from: account.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    })}`
  )

  const {logs} = ((await attestationLogic.attest(
    attestationParams.subject,
    attestationParams.requester,
    attestationParams.reward,
    attestationParams.paymentNonce,
    attestationParams.requesterSig,
    attestationParams.dataHash,
    attestationParams.types,
    attestationParams.requestNonce,
    attestationParams.subjectSig,
    {
      from: account.address,
      gasPrice: new BigNumber(gasPrice).toNumber(),
      gas: 1000000,
    }
  )) as Web3.TransactionReceipt<any>) as Web3.TransactionReceipt<IAttestEventArgs>

  const matchingLog = logs.find(log => log.event === 'TraitAttested')
  if (!matchingLog) {
    throw new Error('Matching log not found')
  }
  return matchingLog
}
