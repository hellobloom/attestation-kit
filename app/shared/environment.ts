import * as dotenv from 'dotenv'
import {BigNumber as bn} from 'bignumber.js'
import {toBuffer} from 'ethereumjs-util'
import {AttestationTypeID} from '@bloomprotocol/attestations-lib'
import {EContractNames} from '@shared/method_manifest'
import axios from 'axios'
import * as merge from 'deepmerge'

dotenv.config()

export type TNodeEnv = 'development' | 'production'

export type TNetworks =
  | 'mainnet'
  | 'rinkeby'
  | 'local'
  | 'kovan'
  | 'sokol'
  | 'ropsten'
  | 'all'

export enum ENetworks {
  'mainnet' = 'mainnet',
  'rinkeby' = 'rinkeby',
  'local' = 'local',
  'kovan' = 'kovan',
  'sokol' = 'sokol',
  'ropsten' = 'ropsten',
  'all' = 'all',
}

export type TProviders = {[P in keyof typeof ENetworks]?: string}

export type TContracts = {
  [CN in keyof typeof EContractNames]: {
    [NN in keyof typeof ENetworks]?: {
      address: string
    }
  }
}

export interface IJobConfig {
  retryLimit?: number
  retryDelay?: number
  retryBackoff?: boolean
}

export enum EJobNames {
  'submitAttestation' = 'submitAttestation',
  'whisperDirectMessage' = 'whisperDirectMessage',
  'whisperBroadcastMessage' = 'whisperBroadcastMessage',
  'whisperEndSession' = 'whisperEndSession',
  'whisperNewBroadcastSession' = 'whisperNewBroadcastSession',
  'whisperSubscribeThenBroadcast' = 'whisperSubscribeThenBroadcast',
  'whisperSubscribeThenDirectMessage' = 'whisperSubscribeThenDirectMessage',
}

export interface IEnvironmentConfig {
  // Main config
  appId: string
  dbUrl: string

  // Environment & version
  nodeEnv: string
  pipelineStage?: string
  sourceVersion?: string

  // Access key
  apiKey: string

  // Logging
  logs: {
    whisper: {
      pings: boolean
      sql: boolean
    }
    level?: string
  }

  // Attester/requester config
  approved_attesters?: IAttestationTypesToArrAnyAll
  approved_requesters?: IAttestationTypesToArrAnyAll
  attester_rewards?: IAttestationTypesToStrAll

  // Provider/contract config
  providers: TProviders
  contracts: TContracts

  // Debugging
  sentryDSN: string

  // Response webhooks config
  webhook: {
    key: string
    address: string
  }

  // Whisper config
  whisper: {
    provider: string
    password: string
    topicPrefix: string
    pollInterval: number
    ping: {
      enabled: boolean
      interval: number
      alertInterval: string
      password: string
    }
  }

  // Ethereum key config
  owner: {
    address: string
    key: string
  }

  // (Optional) Logstash setup
  logstash?: {
    host: string
    username: string
    password: string
  }

  // (Optional) External service for transaction handling
  txService?: {
    address: string
    key: string
    webhookKeySha: string
  }

  jobs: {[P in keyof typeof EJobNames]?: IJobConfig}
}

export type TAtTypeAll = keyof typeof AttestationTypeID | 'all'

export type TAttestationTypesToArr = {
  [P in keyof typeof AttestationTypeID]?: Array<string>
}

export interface IAttestationTypesToArrAnyAll extends TAttestationTypesToArr {
  any?: boolean
  all?: string[]
}

export type TAttestationTypesToStr = {[P in keyof typeof AttestationTypeID]?: string}

export interface IAttestationTypesToStrAll {
  all?: string
}

type TEnvType = 'string' | 'json' | 'int' | 'float' | 'bool' | 'buffer' | 'bn'

const testBool = (value: string) =>
  (['true', 't', 'yes', 'y'] as any).includes(value.toLowerCase())

// Throw an error if the specified environment variable is not defined

const envVar = async (
  e: any,
  name: string,
  type: TEnvType = 'string',
  required: boolean = true,
  defaultVal?: any,
  opts?: {
    baseToParseInto?: number
    silent?: boolean
  }
): Promise<any> => {
  const value = e[name]
  const silent = opts && opts.silent
  if (required) {
    if (!value) {
      if (!silent) {
        throw new Error(`Expected environment variable ${name}`)
      } else {
        return 'UNSPECIFIED_ENV_VALUE'
      }
    }
    switch (type) {
      case 'string':
        return value
      case 'json':
        try {
          return JSON.parse(value)
        } catch (err) {
          console.log('WARNING: Parsing JSON env failed', name, value)
        }
        break
      case 'int':
        return parseInt(value, (opts && opts.baseToParseInto) || 10)
      case 'float':
        return parseFloat(value)
      case 'bool':
        return testBool(value)
      case 'buffer':
        return toBuffer(value)
      case 'bn':
        return new bn(value)
      default:
        if (!silent) {
          throw new Error(`Unhandled type ${type}`)
        }
    }
  } else {
    if (!value && typeof defaultVal !== 'undefined') return defaultVal
    switch (type) {
      case 'string':
        return value
      case 'json':
        try {
          return value && JSON.parse(value)
        } catch (err) {
          console.log('WARNING: Parsing JSON env failed', name, value)
        }
        break
      case 'int':
        return value && parseInt(value, 10)
      case 'bool':
        return value ? testBool(value) : false
      case 'buffer':
        return value && toBuffer(value)
      case 'bn':
        return value && new bn(value)
      default:
        if (!silent) {
          throw new Error(`Unhandled type ${type}`)
        }
    }
  }
}

// Topics shouldn't be number but string
/* 
 * const topics: any = envVar('WHISPER_TOPICS', 'json')
;(Object as any).keys(topics).forEach((k: string) => {
  topics[k] = topics[k].toString()
})
*/

const localOverrides = async (
  httpEnv: IEnvironmentConfig
): Promise<IEnvironmentConfig> => {
  return process.env.ENV_OVERRIDE
    ? merge(httpEnv, JSON.parse(process.env.ENV_OVERRIDE))
    : httpEnv
}

export const getEnvFromHttp = async (): Promise<IEnvironmentConfig> => {
  const conf = await envVar(process.env, 'ENV_SOURCE_HTTP', 'json')

  let axiosArgs: any = {
    method: conf.method,
    url: conf.url,
    headers: conf.headers,
    data: conf.data,
    responseType: 'json',
  }

  if (process.env.NODE_ENV === 'test') {
    var path = require('path')
    var lib = path.join(path.dirname(require.resolve('axios')), 'lib/adapters/http')
    var http = require(lib)
    axiosArgs.adapter = http
  }

  const resp = await axios(axiosArgs)

  if (resp.data.success === true) {
    return await localOverrides(resp.data.env)
  }

  throw new Error(`Environment config retrieval from ${conf.url} failed`)
}

// export const getEnvFromDb = async (): Promise<IEnvironmentConfig> => {}

export const getEnvFromEnv = async (silent = true): Promise<IEnvironmentConfig> => {
  return {
    // Main config
    appId: await envVar(process.env, 'APP_ID', 'string', true), // e.g., attestation-kit_dev_bob
    dbUrl: await envVar(process.env, 'PG_URL'),

    // Environment & version
    nodeEnv: await envVar(process.env, 'NODE_ENV'),
    pipelineStage: await envVar(
      process.env,
      'PIPELINE_STAGE',
      'string',
      false,
      'production'
    ),
    sourceVersion: await envVar(
      process.env,
      'SOURCE_VERSION',
      'string',
      false,
      'Unspecified'
    ),

    // Access key
    apiKey: await envVar(process.env, 'API_KEY_SHA256'),

    // Logging
    logs: {
      whisper: {
        sql: await envVar(process.env, 'LOG_WHISPER_SQL', 'bool', false),
        pings: await envVar(process.env, 'LOG_WHISPER_PINGS', 'bool', false),
      },
      level: await envVar(process.env, 'LOG_LEVEL', 'string', false),
    },

    // Attester/requester config
    approved_attesters: await envVar(
      process.env,
      'APPROVED_ATTESTERS',
      'json',
      false
    ),
    approved_requesters: await envVar(
      process.env,
      'APPROVED_REQUESTERS',
      'json',
      false
    ),
    attester_rewards: await envVar(process.env, 'ATTESTER_MIN_REWARDS', 'json'),

    // Provider/contract config
    providers: await envVar(process.env, 'PROVIDERS', 'json'),
    contracts: await envVar(process.env, 'CONTRACTS', 'json'),

    // Debugging
    sentryDSN: await envVar(process.env, 'SENTRY_DSN'),

    // Response webhooks config
    webhook: {
      key: await envVar(process.env, 'WEBHOOK_KEY'),
      address: await envVar(process.env, 'WEBHOOK_HOST'),
    },

    // Whisper config
    whisper: {
      provider: await envVar(process.env, 'WHISPER_PROVIDER'),
      password: await envVar(process.env, 'WHISPER_PASSWORD'),
      topicPrefix: await envVar(process.env, 'WHISPER_TOPIC_PREFIX'),
      pollInterval: await envVar(
        process.env,
        'WHISPER_POLL_INTERVAL',
        'int',
        false,
        5000
      ),
      ping: {
        enabled: await envVar(process.env, 'WHISPER_PING_ENABLED', 'bool', false), // Defaults to false if not specified
        interval: await envVar(
          process.env,
          'WHISPER_PING_INTERVAL',
          'string',
          false,
          '1 minute'
        ), // PostgreSQL interval - Defaults to 1 min if not specified
        alertInterval: await envVar(
          process.env,
          'WHISPER_PING_ALERT_INTERVAL',
          'string',
          false,
          '5 minutes'
        ), // PostgreSQL interval - Defaults to 1 min if not specified
        password: await envVar(
          process.env,
          'WHISPER_PING_PASSWORD',
          'string',
          // Whether or not the below is required dependent on whether or not whisper ping is enabled
          await envVar(process.env, 'WHISPER_PING_ENABLED', 'bool', false)
        ),
      },
    },

    // Ethereum key config
    owner: {
      address: await envVar(process.env, 'PRIMARY_ETH_ADDRESS'),
      key: await envVar(process.env, 'PRIMARY_ETH_PRIVKEY'),
    },

    // (Optional) Logstash setup
    logstash: await envVar(process.env, 'LOGSTASH', 'json', false),

    // (Optional) External service for transaction handling
    txService: process.env['TX_SERVICE_ADDRESS']
      ? {
          address: await envVar(process.env, 'TX_SERVICE_ADDRESS'),
          key: await envVar(process.env, 'TX_SERVICE_KEY'),
          webhookKeySha: await envVar(process.env, 'TX_SERVICE_KEY_SHA256'),
        }
      : undefined,
    jobs: await envVar(process.env, 'JOBS', 'json', false, {default: {}}),
  }
}

const envSources = ['env', 'http', 'db']
const getEnv = async (): Promise<IEnvironmentConfig> => {
  let envSource = process.env.ENV_SOURCE
  if (typeof envSource === 'undefined' || envSources.indexOf(envSource) === -1) {
    throw new Error('No enviroment source configured!  Aborting.')
  }
  switch (envSource) {
    case 'env':
      return await getEnvFromEnv()
    case 'http':
      return await getEnvFromHttp()
    case 'db':
      throw new Error('Environment config from database not yet supported')
    // return await getEnvFromDb()
    default:
      throw new Error('No enviroment source configured!  Aborting.')
  }
}

export const contractObjByContractAndNetwork = (
  envConf: IEnvironmentConfig,
  contract: keyof typeof EContractNames,
  network: keyof typeof ENetworks = 'mainnet'
) => {
  let cmobj = envConf.contracts[contract]
  let networkObj = cmobj['all'] || cmobj[network]
  if (!networkObj) {
    throw new Error(
      `Couldn't find contract obj for ${contract}, ${network}: ${cmobj}`
    )
  }
  return networkObj
}

var envPr: Promise<IEnvironmentConfig> = new Promise((res, rej) => {
  return getEnv().then(res)
})

export const getContractAddr = async (
  contract: keyof typeof EContractNames,
  network: keyof typeof ENetworks = 'mainnet'
) => {
  const allEnv = await envPr
  var addr = contractObjByContractAndNetwork(allEnv, contract, network).address
  return addr
}

// Wrapper function
export const env = async () => {
  return await envPr
}

// Env accessor functions
export const getProvider = async (network: keyof typeof ENetworks = 'mainnet') => {
  let e = await env()
  return e.providers.all || e.providers[network]
}

export const getJobConfig = async (jn: keyof typeof EJobNames) => {
  let e = await envPr
  if (e.jobs && e.jobs[jn]) {
    return e.jobs[jn]
  } else {
    return {
      retryLimit: 100,
      retryDelay: 5,
      expireIn: '24 hours',
    }
  }
}
