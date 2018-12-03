import {isValidAddress, bufferToHex} from 'ethereumjs-util'
import {uniq} from 'lodash'

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import { IAttestationDataJSONB } from '@shared/models/Attestations/Attestation'
import BigNumber from 'bignumber.js'
import {requiredField} from '@shared/requiredField'
import {serverLogger} from '@shared/logger'
const ethSigUtil = require('eth-sig-util')
import {env} from '@shared/environment'
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

export interface IUnvalidatedAttestParams {
  subject: string
  attester: string
  requester: string
  reward: BigNumber
  requesterSig: string
  data: IAttestationDataJSONB
  requestNonce: string
  subjectSig: string
}

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
  attestParams: TUnvalidated<IAttestParams>
) => (requesterSig: string): boolean => {
  serverLogger.info(`[validatePaymentSig] ${JSON.stringify(attestParams)}`)
  const recoveredEthAddress = ethSigUtil.recoverTypedSignature({
    data: getFormattedTypedDataPayTokens(
      attestParams.tokenEscrowMarketplaceAddress,
      1,
      attestParams.requester,
      attestParams.attester,
      attestParams.reward.toString(10),
      attestParams.requestNonce
    ),
    sig: attestParams.requesterSig
  })
  serverLogger.info(
    `[validateSignedAgreement] recoveredEthAddress '${bufferToHex(
      recoveredEthAddress
    )}'`
  )
  return recoveredEthAddress.toLowerCase() === attestParams.requester.toLowerCase()
}
export const validateSubjectSig = (input: TUnvalidated<IAttestParams>) => (
  subjectSig: string
) => {
  const recoveredETHAddress: string = ethSigUtil.recoverTypedSignature({
    data: HashingLogic.getAttestationAgreement(
      env.attestationContracts.logicAddress,
      1,
      input.dataHash,
      input.requestNonce
    ),
    sig: input.subjectSig,
  })
  return recoveredETHAddress.toLowerCase() === input.subject.toLowerCase()
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
    ['requester', U.isNotEmptyString],
    ['requester', isValidAddress],
    ['requesterSig', U.isNotEmptyString],
    ['subjectSig', validateSignedAgreement(data)],
    ['requesterSig', U.isValidSignatureString],
    ['requesterSig', validatePaymentSig(data)],
    ['dataHash', U.isNotEmptyString],
    ['requestNonce', U.isNotEmptyString],
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

const generateAttestParams = (
  data: TUnvalidated<IUnvalidatedAttestParams>
): TUnvalidated<IAttestParams> => {
  return {
    subject: data.subject,
    attester: data.attester,
    requester: data.requester,
    reward: data.reward,
    requesterSig: data.requesterSig,
    requestNonce: data.requestNonce,
    subjectSig: data.subjectSig,
  }
}

export const validateAttestParams = async (
  input: TUnvalidated<IUnvalidatedAttestParams>
): Promise<IInvalidParamError | {kind: 'validated'; data: IAttestParams}> => {
  try {
    serverLogger.debug('Validating attestation params...')
    const attestParams = generateAttestParams(input)
    const validated = await validateAttestationData(attestParams)
    return {kind: 'validated', data: validated}
  } catch (error) {
    return {kind: 'invalid_param', message: error}
  }
}
