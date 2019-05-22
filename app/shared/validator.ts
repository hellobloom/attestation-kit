import {uniq} from 'lodash'
import * as U from '@shared/utils'

export type TUnvalidated<ValidatedSchema> = {
  readonly [Key in keyof ValidatedSchema]?: any
}

export type TReject = (error: string) => void

interface IInvalidParamError {
  kind: 'invalid_param'
  message: string
}

export const genParamsValidator = <ParamType>(
  validations: Array<
    [keyof TUnvalidated<ParamType>, (value: any, data?: any) => boolean, boolean]
  >
) => {
  return (data: TUnvalidated<ParamType>, reject: TReject): data is ParamType => {
    const requiredFields = uniq(validations.map(([first]) => first as string))

    if (!requiredFields.every(U.requiredField(reject, data))) return false

    const allValidationsPassed = validations.every(
      ([fieldName, validation, useFullData]) => {
        let outcome = useFullData
          ? validation(data[fieldName], data)
          : validation(data[fieldName])
        if (outcome) {
          return true
        }
        reject(`Invalid ${fieldName}`)
        return false
      }
    )

    return allValidationsPassed
  }
}

export const genParamsDataValidator = <ParamType>(
  validations: Array<
    [keyof TUnvalidated<ParamType>, (value: any, data?: any) => boolean, boolean]
  >
) => {
  return async (data: TUnvalidated<ParamType>): Promise<ParamType> =>
    new Promise<ParamType>(async (resolve, reject) => {
      const validateParamsType = genParamsValidator(validations)
      if (!validateParamsType(data, reject)) {
        return
      }
      resolve(data)
    })
}

export const genValidateFn = <ParamType>(
  validations: Array<
    [keyof TUnvalidated<ParamType>, (value: any, data?: any) => boolean, boolean]
  >
) => {
  return async (
    input: TUnvalidated<ParamType>
  ): Promise<IInvalidParamError | {kind: 'validated'; data: ParamType}> => {
    try {
      const paramDataValidator = genParamsDataValidator(validations)
      const validated = await paramDataValidator(input)
      return {kind: 'validated', data: validated}
    } catch (error) {
      return {kind: 'invalid_param', message: error}
    }
  }
}
