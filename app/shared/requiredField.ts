import {ClientFacingError} from '@shared/renderError'

export const requiredField = <T>(
  reject: (reason: ClientFacingError | string) => any,
  data: T
) => (field: string) => {
  if (data[field] === undefined) {
    reject(new ClientFacingError(`Missing ${field}`))
    return false
  }
  return true
}
