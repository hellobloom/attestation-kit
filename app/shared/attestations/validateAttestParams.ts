import {isValidAddress, bufferToHex} from 'ethereumjs-util'
import {uniq} from 'lodash'

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import BigNumber from 'bignumber.js'
import {requiredField} from '@shared/requiredField'
import {serverLogger} from '@shared/logger'
const ethSigUtil = require('eth-sig-util')
import { getFormattedTypedDataPayTokens } from '@shared/ethereum/signingLogic'

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

type TReject = (error: string) => void

export const validateSignedAgreement = (
  attestParams: TUnvalidated<IAttestParams>
) => (subjectSig: string): boolean => {
  serverLogger.info(`[validateSignedAgreement] ${JSON.stringify(attestParams)}`)
  const recoveredEthAddress = ethSigUtil.recoverTypedSignature({
    data: 
    HashingLogic.getAttestationAgreement(
      attestParams.attestationLogicAddress,
      1,
      attestParams.dataHash,
      attestParams.requestNonce,
    ),
    sig: attestParams.subjectSig
  })
  serverLogger.info(
    `[validateSignedAgreement] recoveredEthAddress '${recoveredEthAddress}'`
  )
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
    sig: requesterSig
  })
  serverLogger.info(
    `[validatePaymentSig] recoveredEthAddress '${bufferToHex(
      recoveredEthAddress
    )}'`
  )
  return recoveredEthAddress.toLowerCase() === payer.toLowerCase()
}

export const validateRequesterSig = (
  attestParams: TUnvalidated<IAttestParams>
) => (requesterSig: string): boolean => {
  serverLogger.info(`[validatePaymentSig] ${JSON.stringify(attestParams)}`)
  return validatePaymentSig(
      attestParams.tokenEscrowMarketplaceAddress,
      attestParams.requester,
      attestParams.attester,
      attestParams.reward.toString(10),
      attestParams.requestNonce,
      attestParams.requesterSig,
  )
}

const validateParamsType = (
  data: TUnvalidated<IAttestParams>,
  reject: TReject
): data is IAttestParams => {
  type TValidation = [keyof typeof data, (value: any) => boolean]

  const validations: TValidation[] = [
    ['subjectSig', U.isValidSignatureString],
    ['subjectSig', validateSignedAgreement(data)],
    ['subject', U.isNotEmptyString],
    ['subject', isValidAddress],
    ['attester', U.isNotEmptyString],
    ['attester', isValidAddress],
    ['requester', U.isNotEmptyString],
    ['requester', isValidAddress],
    ['reward', U.isValidReward],
    ['requesterSig', U.isNotEmptyString],
    ['requesterSig', U.isValidSignatureString],
    ['requesterSig', validateRequesterSig(data)],
    ['dataHash', U.isNotEmptyString],
    ['requestNonce', U.isNotEmptyString],
    ['attestationLogicAddress', U.isNotEmptyString],
    ['attestationLogicAddress', U.isNotEmptyString],
    ['tokenEscrowMarketplaceAddress', isValidAddress],
    ['tokenEscrowMarketplaceAddress', isValidAddress],
  ]

  const requiredFields = uniq(validations.map(([first]) => first))

  if (!requiredFields.every(requiredField(reject, data))) return false

  const allValidationsPassed = validations.every(([fieldName, validation]) => {
    if (validation(data[fieldName])) {
      return true
    }
    reject(`Invalid ${fieldName}`)
    return false
  })

  return allValidationsPassed
}

const validateAttestationData = async (
  data: TUnvalidated<IAttestParams>
): Promise<IAttestParams> =>
  new Promise<IAttestParams>(async (resolve, reject) => {
    if (!validateParamsType(data, reject)) {
      return
    }
    resolve(data)
  })

export const validateAttestParams = async (
  input: TUnvalidated<IAttestParams>
): Promise<IInvalidParamError | {kind: 'validated'; data: IAttestParams}> => {
  try {
    serverLogger.debug(`Validating attestation params...${JSON.stringify(input)}`)
    const validated = await validateAttestationData(input)
    return {kind: 'validated', data: validated}
  } catch (error) {
    serverLogger.debug(`invalid param ${error}`)
    return {kind: 'invalid_param', message: error}
  }
}
