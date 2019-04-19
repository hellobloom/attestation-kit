import * as winston from 'winston'
import {env} from '@shared/environment'
import * as Sentry from '@sentry/node'
import {inspect} from 'util'
import axios from 'axios'

export type TLogMsg = Error | string
export type TLogMsgOrEvent = TLogMsg | IEventLog

export interface IEventLog {
  name: string
  event: Object
}

export interface ILogOpts {
  full?: boolean
  event?: boolean
  tags?: any
  error?: boolean
  level?: TLogLevel
}

let envPr = env()

export const isEventLog = (msg: TLogMsgOrEvent): msg is IEventLog => {
  return typeof (<IEventLog>msg) === 'object' && msg.hasOwnProperty('event')
}

export type TLogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
export const LogLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']

export const logger = new winston.Logger({
  timestamp: () => Date.now(),
  transports: [new winston.transports.Console()],
})

export const getStack = () => {
  try {
    throw new Error()
  } catch (e) {
    return JSON.stringify(e.stack)
  }
}

export const sentry = envPr.then(e => {
  Sentry.init({
    dsn: e.sentryDSN,
    environment: e.pipelineStage,
    release: e.sourceVersion,
  })
  Sentry.configureScope(scope => {
    scope.setTag('appId', e.appId)
  })
  return Sentry
})

export const logToConsole = async (msg: TLogMsg, opts: ILogOpts) => {
  try {
    console.log('LOG', new Date().toString(), {error: opts.error}, msg)
  } catch (err) {
    console.log('Error logging failed')
  }
}

export const sendToLogstash = async (
  msg: any,
  msgType: TLogstashType,
  opts: ILogOpts
) => {
  let e = await envPr
  if (!e.logstash) {
    return false
  }
  let payload: ILogstashMsg = {
    $app: e.appId,
    $type: msgType,
    $body: JSON.stringify(msg),
  }
  await axios({
    url: e.logstash.host,
    auth: {
      username: e.logstash.username,
      password: e.logstash.password,
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(payload),
  })
  return true
}

export const logEvent = async (msg: IEventLog, opts: ILogOpts) => {
  try {
    await sendToLogstash(msg, 'event', opts)
  } catch (err) {
    console.log('Failed to send message to Logstash', err.message, err.stack)
  }
}

export const sendToSentry = async (
  msg: TLogMsg,
  opts: ILogOpts,
  sentryInstance: any
) => {
  try {
    JSON.stringify(msg)
  } catch (err) {
    msg = inspect(msg)
  }
  sentryInstance.withScope((scope: any) => {
    if (opts.tags && typeof opts.tags === 'object') {
      Object.keys(opts.tags).forEach((tag: string) => {
        scope.setTag(tag, opts.tags[tag])
      })
    }
    sentryInstance.captureException(msg instanceof Error ? msg : Error(msg))
  })
}

export const logToSentry = async (msg: TLogMsg, opts: ILogOpts) => {
  let sentryInstance: any
  // Initiate Sentry instance
  try {
    sentryInstance = await sentry
  } catch (err) {
    console.log('Initiating Sentry instance failed')
    return false
  }
  // Log error to Sentry
  try {
    await sendToSentry(msg, opts, sentryInstance)
  } catch (err) {
    try {
      if (msg instanceof Error) {
        try {
          msg = `Failed error message with stack: ${msg.message} ${JSON.stringify(
            msg.stack
          )}`
        } catch {
          msg = `Failed error message: ${msg.message}`
        }
      } else {
        msg = "Sentry error logging failed (can't log message)"
      }
      await sendToSentry(msg, opts, sentryInstance)
    } catch (err) {
      console.log('Major Sentry logging failure, giving up')
    }
  }
  return true
}

export const fullLog = async (
  msg: TLogMsg,
  opts: ILogOpts = {error: false, tags: {}}
) => {
  await logToConsole(msg, opts)
  if (opts.error) {
    await logToSentry(msg, opts)
  }
}

export const log = (msg: any, opts: ILogOpts = {}) => {
  logger[opts.level || 'info'](typeof msg === 'string' ? msg : JSON.stringify(msg))
  // Full log ignores log level
  let msgIsEventLog = isEventLog(msg)
  if (opts.full && !msgIsEventLog) {
    return fullLog(
      typeof msg === 'string' || msg instanceof Error ? msg : JSON.stringify(msg),
      opts
    )
  }
  if (opts.event) {
    if (msgIsEventLog) {
      // void logEvent(msg, opts)
      console.log(`not logging event ${JSON.stringify(msg)}`)
    } else {
      console.log(
        'WARNING: Event logging configured incorrectly',
        JSON.stringify(msg),
        JSON.stringify(opts)
      )
    }
  }
  return
}

export interface ILogstashMsg {
  $app: string
  $type: string
  $body: any
}

export type TLogstashType = 'event' | 'log'
