import {env} from '@shared/environment'
import * as Web3 from 'web3'
import {loadAttestationLogic} from '@shared/contracts/load'
import {serverLogger} from '@shared/logger'
import {IAttestParams} from '@shared/attestations/validateAttestParams'
import * as account from '@shared/ethereum/account'
import BigNumber from 'bignumber.js'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'
import {TSignedAgreementRequestPayload} from './validations'

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
  gasPrice: string
) => {
  serverLogger.info(`Sending attest transaction for ${attestationParams.subject}`)
  attestationParams.types = attestationParams.types.sort(
    (a: number, b: number) => a - b
  )
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

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export const sendAttestTxV2 = async (
  attestationParams: Omit<
    TSignedAgreementRequestPayload,
    'attestationId' | 'gasPrice'
  >,
  gasPrice: string
) => {
  serverLogger.info(
    `[sendAttestV2] ${JSON.stringify({...attestationParams, gasPrice})}`
  )

  const {logs} = ((await attestationLogic.attest(
    attestationParams.subject,
    attestationParams.requester,
    0, // EH TODO How should we be getting this? // Should have this after soliciting / negotiation process
    '', // EH TODO How should we be getting this? // Should have this after soliciting / negotiation process
    '', // EH TODO How should we be getting this? // Should have this after soliciting / negotiation process
    attestationParams.dataHash,
    [], // EH TODO How should we be getting this?
    attestationParams.nonce,
    attestationParams.signature,
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
