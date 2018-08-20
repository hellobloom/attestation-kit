import * as express from 'express'
import * as Sequelize from 'sequelize'
import {serverLogger} from '@shared/logger'

const DEFAULT_ERROR_MESSAGE = 'Looks like something went wrong.'

/**
 * Use this class when it's acceptable to display the error message to a user.
 * Otherwise, #renderError will return in the response the DEFAULT_ERROR_MESSAGE.
 * You can think of this class as saying "This is a whitelisted error, safe for
 * the user".
 */
export class ClientFacingError extends Error {
  constructor(m?: string) {
    // Always display the client some message.
    super(m || DEFAULT_ERROR_MESSAGE)
  }
}

// More info: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export enum HttpStatus {
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
}

/**
 * This functions (1) logs the error and (2) returns a JSON error. If it's
 * specified to be a ClientFacingError, the logged and returned errors are
 * the same. If not, it logs that error but returns a generic error to shield
 * against displaying internatl data to the client.
 */
export const renderError = (
  _: express.Request,
  res: express.Response,
  status: number = HttpStatus.badRequest
) => (error?: string | Error) => {
  const errorToLog = error instanceof Sequelize.Error ? error.message : error
  serverLogger.warn('Request failed!', {error: errorToLog, status})
  const errorForClient =
    error instanceof ClientFacingError // Only display whitelisted errors
      ? error.message
      : DEFAULT_ERROR_MESSAGE
  res
    .status(status)
    .json({error: errorForClient})
    .end()
}
