import {isValidAddress, bufferToHex} from 'ethereumjs-util'

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import BigNumber from 'bignumber.js'
import {log} from '@shared/logger'
const ethSigUtil = require('eth-sig-util')
import {getFormattedTypedDataPayTokens} from '@shared/ethereum/signingLogic'
import {genValidateFn} from '@shared/validator'

interface IInvalidParamError {
  kind: 'invalid_param'
  message: string
}

interface ISuccess {
  kind: 'validated'
  data: IAttestParams
}

export type TValidateAttestParamsOutput = IInvalidParamError | ISuccess

export interface IAttestParams {
  attestationId: string
  subject: string
  attester: string
  requester: string
  reward: BigNumber
  requesterSig: string
  dataHash: string
  requestNonce: string
  subjectSig: string
  attestationLogicAddress: string
  tokenEscrowMarketplaceAddress: string
}

export interface IAttestForParams extends IAttestParams {
  delegationSig: string
}

export const validateSignedAgreement = (
  subjectSig: string,
  attestParams: TUnvalidated<IAttestParams>
) => {
  log(`[validateSignedAgreement] ${JSON.stringify(attestParams)}`)
  const recoveredEthAddress = ethSigUtil.recoverTypedSignature({
    data: HashingLogic.getAttestationAgreement(
      attestParams.attestationLogicAddress,
      1,
      attestParams.dataHash,
      attestParams.requestNonce
    ),
    sig: attestParams.subjectSig,
  })
  log(`[validateSignedAgreement] recoveredEthAddress '${recoveredEthAddress}'`)
  return recoveredEthAddress.toLowerCase() === attestParams.subject.toLowerCase()
}

export const validatePaymentSig = (
  tokenEscrowMarketplaceAddress: string,
  payer: string,
  payee: string,
  reward: string,
  requestNonce: string,
  requesterSig: string
): boolean => {
  const recoveredEthAddress = ethSigUtil.recoverTypedSignature({
    data: getFormattedTypedDataPayTokens(
      tokenEscrowMarketplaceAddress,
      1,
      payer,
      payee,
      reward,
      requestNonce
    ),
    sig: requesterSig,
  })
  log(
    `[validatePaymentSig] recoveredEthAddress '${bufferToHex(recoveredEthAddress)}'`
  )
  return recoveredEthAddress.toLowerCase() === payer.toLowerCase()
}

export const validateRequesterSig = (
  requesterSig: string,
  attestParams: TUnvalidated<IAttestParams>
) => {
  log(`[validatePaymentSig] ${JSON.stringify(attestParams)}`)
  // if no reward requesterSig does not need to be checked
  if (attestParams.reward.toString() === '0') return true
  return validatePaymentSig(
    attestParams.tokenEscrowMarketplaceAddress,
    attestParams.requester,
    attestParams.attester,
    attestParams.reward.toString(10),
    attestParams.requestNonce,
    attestParams.requesterSig
  )
}

export const validateAttestParams = genValidateFn([
  ['subjectSig', U.isValidSignatureString, false],
  ['subjectSig', validateSignedAgreement, true],
  ['subject', U.isNotEmptyString, false],
  ['subject', isValidAddress, false],
  ['attester', U.isNotEmptyString, false],
  ['attester', isValidAddress, false],
  ['requester', U.isNotEmptyString, false],
  ['requester', isValidAddress, false],
  ['reward', U.isValidReward, false],
  ['requesterSig', U.isNotEmptyString, false],
  ['requesterSig', U.isValidEthHexString, false],
  ['requesterSig', validateRequesterSig, true],
  ['dataHash', U.isNotEmptyString, false],
  ['requestNonce', U.isNotEmptyString, false],
  ['attestationLogicAddress', U.isNotEmptyString, false],
  ['attestationLogicAddress', U.isNotEmptyString, false],
  ['tokenEscrowMarketplaceAddress', isValidAddress, false],
  ['tokenEscrowMarketplaceAddress', isValidAddress, false],
])
