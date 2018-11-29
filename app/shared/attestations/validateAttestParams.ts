import {isValidAddress, bufferToHex} from 'ethereumjs-util'
import {uniq} from 'lodash'

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {AttestationTypeID, HashingLogic} from '@bloomprotocol/attestations-lib'
import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'
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
  subject: string
  attester: string
  requester: string
  reward: BigNumber
  requesterSig: string
  dataHash: string
  requestNonce: string
  subjectSig: string
}

export interface IAttestForParams extends IAttestParams {
  delegationSig: string
}

type TReject = (error: string) => void

export const validateSubjectSig = (input: TUnvalidated<IAttestParams>) => (
  subjectSig: string
) => {
  const recoveredETHAddress: string = ethSigUtil.recoverTypedSignatureLegacy({
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

export const validateRequesterSig = (input: TUnvalidated<IAttestParams>) => (
  requesterSig: string
) => {
  serverLogger.debug('Validating requester sig...')
  const recoveredETHAddress: string = ethSigUtil.recoverTypedSignatureLegacy({
    data: getFormattedTypedDataPayTokens(
      env.tokenEscrowMarketplace.address,
      1,
      input.requester,
      input.attester,
      input.reward.toString(),
      input.requestNonce,
    ),
    sig: input.requesterSig,
  })
  return recoveredETHAddress.toLowerCase() === input.requester.toLowerCase()
}

const validateParamsType = (
  data: TUnvalidated<IAttestParams>,
  reject: TReject
): data is IAttestParams => {
  type TValidation = [keyof typeof data, (value: any) => boolean]

  const validations: TValidation[] = [
    ['subjectSig', U.isValidSignatureString],
    ['subjectSig', validateSubjectSig(data)],
    ['subject', U.isNotEmptyString],
    ['subject', isValidAddress],
    ['requester', U.isNotEmptyString],
    ['requester', isValidAddress],
    ['requesterSig', U.isNotEmptyString],
    ['subjectSig', validateRequesterSig(data)],
    ['requesterSig', U.isValidSignatureString],
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
    dataHash: bufferToHex(HashingLogic.getMerkleTree(data.data.data).getRoot()), // IP TODO data.data.data is bad
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
