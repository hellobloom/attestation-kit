import {isValidAddress, toBuffer} from 'ethereumjs-util'
import {uniq} from 'lodash'
const ethSigUtil = require('eth-sig-util')

import {TUnvalidated} from '@shared/params/validation'
import * as U from '@shared/utils'
import {AttestationTypeID} from 'attestations-lib'
import {
  hashCompleteAttestationData,
  hashTypeIds,
} from '@shared/ethereum/signingLogic'
import {
  IAttestationData,
  IAttestationDataJSONB,
} from '@shared/models/Attestations/Attestation'
import {requiredField} from '@shared/requiredField'
import {every} from 'lodash'

import {serverLogger} from '@shared/logger'

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

const agreementData = (input: TUnvalidated<IJobDetails>) => [
  {type: 'address', name: 'subject', value: input.subject},
  {type: 'address', name: 'attester', value: input.attester},
  {type: 'address', name: 'requester', value: input.requester},
  {
    type: 'bytes32',
    name: 'dataHash',
    value: hashCompleteAttestationData(input.data.data),
  },
  {
    type: 'bytes32',
    name: 'typeHash',
    value: hashTypeIds(input.types),
  },
  {type: 'bytes32', name: 'nonce', value: input.requestNonce},
]

const validateSubjectSig = (unvalidatedJobDetails: TUnvalidated<IJobDetails>) => (
  subjectSig: string
) => {
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
  const expectedDigest = ethSigUtil.typedSignatureHash(
    agreementData(agreementDataInput)
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
  input: IAttestationData,
  type: AttestationTypeID
): boolean => {
  let validData: boolean = false
  var obj: any
  switch (type) {
    case AttestationTypeID.phone:
      validData = U.isValidPhoneNumber(input.data)
      break
    case AttestationTypeID.email:
      validData = U.isValidEmail(input.data)
      break
    case AttestationTypeID.facebook:
      obj = JSON.parse(input.data)
      validData = every(['id'], (key: any) => typeof obj[key] !== 'undefined')
      break
    case AttestationTypeID.sanctionScreen:
      // Note: temporarily validating only that there is a non-empty / whitespace id prop on the provided JSON
      // This is essentially the same validation bloom-web is doing
      const objWithIdProp: {id?: string} = JSON.parse(input.data)
      validData = objWithIdProp.id !== undefined && objWithIdProp.id.trim() !== ''
      break
    case AttestationTypeID.pepScreen:
      break
    case AttestationTypeID.idDocument:
      const idDocumentData = JSON.parse(input.data)
      validData =
        idDocumentData &&
        idDocumentData.authenticationResult &&
        idDocumentData.authenticationResult === 1 // Passed
      break
    case AttestationTypeID.google:
      obj = JSON.parse(input.data)
      validData = every(
        ['resourceName'],
        (key: any) => typeof obj[key] !== 'undefined'
      )
      break
    case AttestationTypeID.linkedin:
      obj = JSON.parse(input.data)
      validData = every(
        ['firstName', 'id', 'lastName'],
        (key: any) => typeof obj[key] !== 'undefined'
      )
      break
    case AttestationTypeID.twitter:
      obj = JSON.parse(input.data)
      validData = every(['id'], (key: any) => typeof obj[key] !== 'undefined')
      break
    case AttestationTypeID.payroll:
      break
    case AttestationTypeID.ssn:
      break
    case AttestationTypeID.criminal:
      break
    case AttestationTypeID.offense:
      break
    case AttestationTypeID.driving:
      break
    case AttestationTypeID.employment:
      break
    case AttestationTypeID.education:
      break
    case AttestationTypeID.drug:
      break
    case AttestationTypeID.bank:
      break
    case AttestationTypeID.utility:
      break
    default:
      break
  }
  return validData
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
