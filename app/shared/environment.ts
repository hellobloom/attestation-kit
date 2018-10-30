import * as dotenv from 'dotenv'
import {BigNumber as bn} from 'bignumber.js'
import {toBuffer} from 'ethereumjs-util'

dotenv.config()

interface IEnvironmentConfig {
  apiKey: string
  appPort: number
  approved_attesters?: IAttestationTypesToArr
  approved_requesters?: IAttestationTypesToArr
  attester_rewards?: IAttestationTypesToStr
  bltAddress: string
  dbUrl: string
  nodeEnv: string
  rinkebyAccountRegistryAddress: string
  rinkebyWeb3Provider: string
  sentryDSN: string
  skipValidations: boolean
  web3Provider: string
  webhook_host: string
  webhook_key: string
  whisperPollInterval?: number
  attestationContracts: {
    repoAddress: string
    logicAddress: string
  }
  tokenEscrowMarketplace: {
    address: string
  }
  owner: {
    ethAddress: string
    ethPrivKey: string
  }
  whisper: {
    provider: string
    password: string
    topics: IWhisperTopics
    ping: {
      enabled: boolean
      interval: number
    }
  }
  logs: {
    whisperSql: boolean
    level?: string
  }
}

export interface IAttestationTypesToArr {
  any?: string
  all?: string[]
  phone?: string[]
  email?: string[]
  'sanction-screen'?: string[]
  facebook?: string[]
  'pep-screen'?: string[]
  'id-document'?: string[]
  google?: string[]
  linkedin?: string[]
  twitter?: string[]
  payroll?: string[]
  ssn?: string[]
  criminal?: string[]
  offense?: string[]
  driving?: string[]
  employment?: string[]
  education?: string[]
  drug?: string[]
  bank?: string[]
  utility?: string[]
}

export interface IAttestationTypesToStr {
  all?: string
  phone?: string
  email?: string
  'sanction-screen'?: string
  facebook?: string
  'pep-screen'?: string
  'id-document'?: string
  google?: string
  linkedin?: string
  twitter?: string
  payroll?: string
  ssn?: string
  criminal?: string
  offense?: string
  driving?: string
  employment?: string
  education?: string
  drug?: string
  bank?: string
  utility?: string
}

interface IWhisperTopics {
  ping: string
  phone: string
  email: string
  'sanction-screen': string
  facebook: string
  'pep-screen': string
  'id-document': string
  google: string
  linkedin: string
  twitter: string
  payroll: string
  ssn: string
  criminal: string
  offense: string
  driving: string
  employment: string
  education: string
  drug: string
  bank: string
  utility: string
}

type TEnvType = 'string' | 'json' | 'int' | 'float' | 'bool' | 'buffer' | 'bn'

// Throw an error if the specified environment variable is not defined
const envVar = (
  name: string,
  type?: TEnvType,
  required?: boolean,
  defaultVal?: any,
  opts?: {
    baseToParseInto?: number
  }
): any => {
  const value = process.env[name]
  if (required) {
    if (!value) {
      throw new Error(`Expected environment variable ${name}`)
    }
    switch (type) {
      case !type || 'string':
        return value
      case 'json':
        return JSON.parse(value)
      case 'int':
        return parseInt(value, opts && opts.baseToParseInto)
      case 'float':
        return parseFloat(value)
      case 'bool':
        return (['true', 't', 'yes', 'y'] as any).includes(value.toLowerCase)
      case 'buffer':
        return toBuffer(value)
      case 'bn':
        return new bn(value)
    }
  } else {
    if (!value && typeof defaultVal !== 'undefined') return defaultVal
    switch (type) {
      case !type || 'string':
        return value
      case 'json':
        return value && JSON.parse(value)
      case 'int':
        return value && parseInt(value)
      case 'bool':
        return !!value
      case 'buffer':
        return value && toBuffer(value)
      case 'bn':
        return value && new bn(value)
    }
  }
}

// Topics shouldn't be number but string
const topics = envVar('WHISPER_TOPICS', 'json')

Object.keys(topics).forEach(k => {
  topics[k] = topics[k].toString()
})

export const env: IEnvironmentConfig = {
  apiKey: envVar('API_KEY_SHA256'),
  appPort: envVar('PORT', 'int', false, 3000),
  approved_attesters: envVar('APPROVED_ATTESTERS', 'json', false),
  approved_requesters: envVar('APPROVED_REQUESTERS', 'json', false),
  attester_rewards: envVar('ATTESTER_MIN_REWARDS', 'json'),
  bltAddress: envVar('BLT_ADDRESS'),
  dbUrl: envVar('BLOOM_WHISPER_PG_URL'),
  nodeEnv: envVar('NODE_ENV'),
  rinkebyAccountRegistryAddress: envVar('RINKEBY_ACCOUNT_REGISTRY_ADDRESS'),
  rinkebyWeb3Provider: envVar('RINKEBY_WEB3_PROVIDER'),
  sentryDSN: envVar('SENTRY_DSN'),
  web3Provider: envVar('WEB3_PROVIDER'),
  webhook_host: envVar('WEBHOOK_HOST'),
  webhook_key: envVar('WEBHOOK_KEY'),
  attestationContracts: {
    repoAddress: envVar('ATTESTATION_REPO_ADDRESS'),
    logicAddress: envVar('ATTESTATION_LOGIC_ADDRESS'),
  },
  logs: {
    whisperSql: envVar('QUIET_POLLING', 'bool', false),
    level: envVar('LOG_LEVEL', 'string', false),
  },
  owner: {
    ethAddress: envVar('PRIMARY_ETH_ADDRESS'),
    ethPrivKey: envVar('PRIMARY_ETH_PRIVKEY'),
  },
  skipValidations: envVar('SKIP_VALIDATIONS', 'bool', false),
  tokenEscrowMarketplace: {
    address: envVar('TOKEN_ESCROW_MARKETPLACE_ADDRESS'),
  },
  whisper: {
    provider: envVar('WHISPER_PROVIDER'),
    password: envVar('WHISPER_PASSWORD'),
    topics: topics,
    ping: {
      enabled: envVar('WHISPER_PING_ENABLED', 'bool', false),
      interval: envVar('WHISPER_PING_INTERVAL', 'int', false, 15000),
    },
  },
  whisperPollInterval: (() => {
    var intvl = envVar('WHISPER_POLL_INTERVAL', 'string', false)
    return intvl ? parseInt(intvl, 10) : undefined
  })(),
}
