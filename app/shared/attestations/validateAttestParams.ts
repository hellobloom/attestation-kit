import {isValidAddress, bufferToHex} from 'ethereumjs-util'
import {uniq} from 'lodash'

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {getFormattedTypedDataReleaseTokensLegacy} from '@shared/ethereum/signingLogic'
import {AttestationTypeID, HashingLogic} from '@bloomprotocol/attestations-lib'
import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'
import BigNumber from 'bignumber.js'
import {requiredField} from '@shared/requiredField'
import {serverLogger} from '@shared/logger'
const ethSigUtil = require('eth-sig-util')

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
  paymentNonce: string
  requesterSig: string
  data: IAttestationDataJSONB
  types: AttestationTypeID[]
  requestNonce: string
  subjectSig: string
}

export interface IAttestParams {
  subject: string
  attester: string
  requester: string
  reward: BigNumber
  paymentNonce: string
  requesterSig: string
  dataHash: string
  types: AttestationTypeID[]
  requestNonce: string
  subjectSig: string
}

type TReject = (error: string) => void

export const validateSubjectSig = (input: TUnvalidated<IAttestParams>) => (
  subjectSig: string
) => {
  const attestationAgreement = {
    subject: input.subject,
    attester: input.attester,
    requester: input.requester,
    dataHash: input.dataHash,
    typeHash: HashingLogic.hashAttestationTypes(input.types),
    nonce: input.requestNonce,
  }
  const recoveredETHAddress: string = ethSigUtil.recoverTypedSignatureLegacy({
    data: HashingLogic.getAttestationAgreement(attestationAgreement),
    sig: input.subjectSig,
  })
  return recoveredETHAddress.toLowerCase() === input.subject.toLowerCase()
}

export const validateRequesterSig = (input: TUnvalidated<IAttestParams>) => (
  requesterSig: string
) => {
  serverLogger.debug('Validating requester sig...')
  const recoveredETHAddress: string = ethSigUtil.recoverTypedSignatureLegacy({
    data: getFormattedTypedDataReleaseTokensLegacy(
      input.requester,
      input.attester,
      input.reward.toString(),
      input.paymentNonce
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
    ['paymentNonce', U.isNotEmptyString],
    ['requesterSig', U.isNotEmptyString],
    ['subjectSig', validateRequesterSig(data)],
    ['requesterSig', U.isValidSignatureString],
    ['dataHash', U.isNotEmptyString],
    ['types', value => value instanceof Array],
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
    paymentNonce: data.paymentNonce,
    requesterSig: data.requesterSig,
    dataHash: bufferToHex(HashingLogic.getMerkleTree(data.data.data).getRoot()), // IP TODO data.data.data is bad
    types: data.types,
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
