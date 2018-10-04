import {isValidAddress, toBuffer, bufferToHex} from 'ethereumjs-util'
import {uniq} from 'lodash'
const ethSigUtil = require('eth-sig-util')

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {
  AttestationTypeID,
  getAttestationTypeStr,
  TAttestationTypeNames,
  HashingLogic,
} from '@bloomprotocol/attestations-lib'
import {IAttestationDataJSONB} from '@shared/models/Attestations/Attestation'
import {requiredField} from '@shared/requiredField'
import {every} from 'lodash'

import {serverLogger} from '@shared/logger'
import {env} from '@shared/environment'

interface IInvalidParamError {
  kind: 'invalid_param'
  message: string
}

interface ISuccess {
  kind: 'validated'
  data: IJobDetails
}

export type TValidateJobDetailsOutput = IInvalidParamError | ISuccess

export interface IJobDetails {
  data: IAttestationDataJSONB
  requestNonce: string
  types: number[]
  subject: string
  subjectSig: string
  attester: string
  requester: string
}

type TReject = (error: string) => void

const validateSubjectSig = (unvalidatedJobDetails: TUnvalidated<IJobDetails>) => (
  subjectSig: string
) => {
  if (env.skipValidations) {
    serverLogger.info(
      '[validateJobDetails.ts] Skipping validation of subject signature.'
    )
    return true
  }

  serverLogger.info('Validating subject sig', subjectSig)
  const agreementDataInput = {
    requestNonce: unvalidatedJobDetails.requestNonce,
    types: unvalidatedJobDetails.types,
    subject: unvalidatedJobDetails.subject,
    subjectSig: unvalidatedJobDetails.subjectSig,
    attester: unvalidatedJobDetails.attester,
    requester: unvalidatedJobDetails.requester,
    data: {
      data: unvalidatedJobDetails.data.data,
    },
  }
  const merkleTree = HashingLogic.getMerkleTree(agreementDataInput.data.data)
  const merkleTreeRootHash = bufferToHex(merkleTree.getRoot())
  const expectedDigest = ethSigUtil.typedSignatureHash(
    HashingLogic.getAttestationAgreement({
      subject: agreementDataInput.subject,
      attester: agreementDataInput.attester,
      requester: agreementDataInput.requester,
      dataHash: merkleTreeRootHash,
      typeHash: HashingLogic.hashAttestationTypes(agreementDataInput.types),
      nonce: agreementDataInput.requestNonce,
    })
  )
  serverLogger.info('Agreement data input', agreementDataInput)
  serverLogger.info('Expected digest', expectedDigest)
  const subjectETHAddress = toBuffer(unvalidatedJobDetails.subject)
  const recoveredETHAddress = U.recoverEthAddressFromDigest(
    toBuffer(expectedDigest),
    subjectSig
  )
  serverLogger.info(
    'Eth addresses of signature',
    subjectETHAddress,
    recoveredETHAddress
  )
  return recoveredETHAddress.equals(subjectETHAddress)
}

const validateParamsType = (
  data: TUnvalidated<IJobDetails>,
  reject: TReject
): data is IJobDetails => {
  type TValidation = [keyof typeof data, (value: any) => boolean]

  const validations: TValidation[] = [
    ['subjectSig', U.isValidSignatureString],
    ['subjectSig', validateSubjectSig(data)],
    ['subject', U.isNotEmptyString],
    ['subject', isValidAddress],
    ['attester', U.isNotEmptyString],
    ['attester', isValidAddress],
    ['requester', U.isNotEmptyString],
    ['requester', isValidAddress],
    ['requestNonce', U.isNotEmptyString],
    ['types', value => value instanceof Array],
  ]

  // TODO: This could be collapsed into validations similar to above
  const requiredFields = uniq(validations.map(([first]) => first))
  serverLogger.info(
    'Do all required fields exist?',
    requiredFields.map(f => [f, requiredField(reject, data)(f)])
  )

  if (!requiredFields.every(requiredField(reject, data))) return false

  const allValidationsPassed = validations.every(([fieldName, validation]) => {
    serverLogger.info('Validating field', fieldName, data[fieldName])
    if (validation(data[fieldName])) {
      return true
    }
    serverLogger.info('Validation failed for field', fieldName, data[fieldName])
    reject(`Invalid ${fieldName}`)
    return false
  })

  return allValidationsPassed
}

const validateJobData = async (
  data: TUnvalidated<IJobDetails>
): Promise<IJobDetails> =>
  new Promise<IJobDetails>(async (resolve, reject) => {
    if (!validateParamsType(data, reject)) {
      return
    }
    resolve(data)
  })

export const validateJobDetails = async (
  input: TUnvalidated<IJobDetails>
): Promise<IInvalidParamError | {kind: 'validated'; data: IJobDetails}> => {
  try {
    const validated = await validateJobData(input)
    return {kind: 'validated', data: validated}
  } catch (error) {
    return {kind: 'invalid_param', message: error}
  }
}

export const validateSubjectDataComponent = (
  input: HashingLogic.IAttestationData,
  type: AttestationTypeID
): boolean => {
  let dataIsValid: boolean = false
  var obj: any
  const typeStr: TAttestationTypeNames = getAttestationTypeStr(type)

  switch (typeStr) {
    case 'phone':
      dataIsValid = U.isValidPhoneNumber(input.data)
      break
    case 'email':
      dataIsValid = U.isValidEmail(input.data)
      break
    case 'facebook':
      obj = JSON.parse(input.data)
      dataIsValid = every(['id'], (key: any) => typeof obj[key] !== 'undefined')
      break
    case 'sanction-screen':
      // Note: temporarily validating only that there is a non-empty / whitespace id prop on the provided JSON
      // This is essentially the same validation bloom-web is doing
      const objWithIdProp: {id?: string} = JSON.parse(input.data)
      dataIsValid = objWithIdProp.id !== undefined && objWithIdProp.id.trim() !== ''
      break
    case 'pep-screen':
      break
    case 'id-document':
      const idDocumentData = JSON.parse(input.data)
      dataIsValid =
        idDocumentData &&
        idDocumentData.authenticationResult &&
        idDocumentData.authenticationResult === 1 // Passed
      break
    case 'google':
      obj = JSON.parse(input.data)
      dataIsValid = every(
        ['resourceName'],
        (key: any) => typeof obj[key] !== 'undefined'
      )
      break
    case 'linkedin':
      obj = JSON.parse(input.data)
      dataIsValid = every(
        ['firstName', 'id', 'lastName'],
        (key: any) => typeof obj[key] !== 'undefined'
      )
      break
    case 'twitter':
      obj = JSON.parse(input.data)
      dataIsValid = every(['id'], (key: any) => typeof obj[key] !== 'undefined')
      break
    case 'payroll':
      break
    case 'ssn':
      break
    case 'criminal':
      break
    case 'offense':
      break
    case 'driving':
      break
    case 'employment':
      break
    case 'education':
      break
    case 'drug':
      break
    case 'bank':
      break
    case 'utility':
      break
    case 'income':
      break
    case 'assets':
      break
    default:
      break
  }
  return dataIsValid
}

export const validateSubjectData = (
  input: IAttestationDataJSONB,
  type: AttestationTypeID[]
): boolean => {
  if (!input || input.data.length !== type.length) return false

  for (let i in input.data) {
    if (!validateSubjectDataComponent(input.data[i], type[i])) return false
  }
  return true
}
