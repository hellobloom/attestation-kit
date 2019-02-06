import * as dotenv from 'dotenv'
import {BigNumber as bn} from 'bignumber.js'
import {toBuffer} from 'ethereumjs-util'
import {AttestationTypeID} from '@bloomprotocol/attestations-lib'

dotenv.config()

export type TNodeEnv = 'development' | 'production'

export interface IEnvironmentConfig {
  sourceVersion?: string
  pipelineStage?: string
  apiKey: string
  appId: string
  appPort: number
  approved_attesters?: IAttestationTypesToArrAnyAll
  approved_requesters?: IAttestationTypesToArrAnyAll
  attester_rewards?: IAttestationTypesToStrAll
  bltAddress: string
  dbUrl: string
  nodeEnv: string
  rinkebyWeb3Provider: string
  sentryDSN: string
  skipValidations: boolean
  web3Provider: string
  webhook_host: string
  webhook_key: string
  whisperPollInterval?: number
  attestationContracts: {
    logicAddress: string
  }
  tokenEscrowMarketplace: {
    address: string
  }
  owner: {
    ethAddress: string
    ethPrivKey: string
  }
  logstash: {
    host: string
    username: string
    password: string
  }
  whisper: {
    provider: string
    password: string
    topicPrefix: string
    ping: {
      enabled: boolean
      interval: number
      alertInterval: string
      password: string
    }
  }
  logs: {
    whisper: {
      pings: boolean
      sql: boolean
    }
    level?: string
  }
  log_level?: string
  txService?: {
    address: string
    key: string
    webhookKeySha: string
  }
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
  }
): Promise<any> => {
  const value = e[name]
  if (required) {
    if (!value) {
      throw new Error(`Expected environment variable ${name}`)
    }
    switch (type) {
      case 'string':
        return value
      case 'json':
        return JSON.parse(value)
      case 'int':
        return parseInt(value, opts && opts.baseToParseInto)
      case 'float':
        return parseFloat(value)
      case 'bool':
        return testBool(value)
      case 'buffer':
        return toBuffer(value)
      case 'bn':
        return new bn(value)
      default:
        throw new Error(`Unhandled type ${type}`)
    }
  } else {
    if (!value && typeof defaultVal !== 'undefined') return defaultVal
    switch (type) {
      case 'string':
        return value
      case 'json':
        return value && JSON.parse(value)
      case 'int':
        return value && parseInt(value)
      case 'bool':
        return value ? testBool(value) : false
      case 'buffer':
        return value && toBuffer(value)
      case 'bn':
        return value && new bn(value)
      default:
        throw new Error(`Unhandled type ${type}`)
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

export const getEnvFromHttp = async (): Promise<IEnvironmentConfig> => {}
export const getEnvFromDb = async (): Promise<IEnvironmentConfig> => {}
export const getEnvFromEnv = async (): Promise<IEnvironmentConfig> => {
  return {
    sourceVersion: await envVar(
      process.env,
      'SOURCE_VERSION',
      'string',
      false,
      'Unspecified'
    ),
    pipelineStage: await envVar(
      process.env,
      'PIPELINE_STAGE',
      'string',
      false,
      'production'
    ),
    apiKey: await envVar(process.env, 'API_KEY_SHA256'),
    appId: await envVar(process.env, 'APP_ID', 'string', true), // e.g., attestation-kit_dev_bob
    appPort: await envVar(process.env, 'PORT', 'int', false, 3000),
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
    bltAddress: await envVar(process.env, 'BLT_ADDRESS'),
    dbUrl: await envVar(process.env, 'PG_URL'),
    nodeEnv: await envVar(process.env, 'NODE_ENV'),
    rinkebyWeb3Provider: await envVar(process.env, 'RINKEBY_WEB3_PROVIDER'),
    sentryDSN: await envVar(process.env, 'SENTRY_DSN'),
    web3Provider: await envVar(process.env, 'WEB3_PROVIDER'),
    webhook_host: await envVar(process.env, 'WEBHOOK_HOST'),
    webhook_key: await envVar(process.env, 'WEBHOOK_KEY'),
    attestationContracts: {
      logicAddress: await envVar(process.env, 'ATTESTATION_LOGIC_ADDRESS'),
    },
    logs: {
      whisper: {
        sql: await envVar(process.env, 'LOG_WHISPER_SQL', 'bool', false),
        pings: await envVar(process.env, 'LOG_WHISPER_PINGS', 'bool', false),
      },
      level: await envVar(process.env, 'LOG_LEVEL', 'string', false),
    },
    owner: {
      ethAddress: await envVar(process.env, 'PRIMARY_ETH_ADDRESS'),
      ethPrivKey: await envVar(process.env, 'PRIMARY_ETH_PRIVKEY'),
    },
    skipValidations: await envVar(process.env, 'SKIP_VALIDATIONS', 'bool', false),
    tokenEscrowMarketplace: {
      address: await envVar(process.env, 'TOKEN_ESCROW_MARKETPLACE_ADDRESS'),
    },
    logstash: await envVar(process.env, 'LOGSTASH', 'json', false),
    whisper: {
      provider: await envVar(process.env, 'WHISPER_PROVIDER'),
      password: await envVar(process.env, 'WHISPER_PASSWORD'),
      topicPrefix: await envVar(process.env, 'WHISPER_TOPIC_PREFIX'),
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
          await envVar(process.env, 'WHISPER_PING_ENABLED', 'bool', false) // Whether or not it's required dependent on whether or not whisper ping is enabled
        ),
      },
    },
    whisperPollInterval: await envVar(
      process.env,
      'WHISPER_POLL_INTERVAL',
      'int',
      false,
      5000
    ),
    txService: process.env['TX_SERVICE_ADDRESS']
      ? {
          address: await envVar(process.env, 'TX_SERVICE_ADDRESS'),
          key: await envVar(process.env, 'TX_SERVICE_KEY'),
          webhookKeySha: await envVar(process.env, 'TX_SERVICE_KEY_SHA256'),
        }
      : undefined,
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
      return await getEnvFromDb()
    default:
      throw new Error('No enviroment source configured!  Aborting.')
  }
}

var envPr: Promise<IEnvironmentConfig> = new Promise((res, rej) => {
  getEnv().then(res)
})

// Wrapper function
export const env = async () => {
  return await envPr
}
