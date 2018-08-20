import {toNumber} from 'lodash'
import * as dotenv from 'dotenv'

dotenv.config()

interface IEnvironmentConfig {
  apiKey: string
  dbUrl: string
  rinkebyAccountRegistryAddress: string
  appPort: number
  nodeEnv: string
  bltAddress: string
  web3Provider: string
  rinkebyWeb3Provider: string
  sentryDSN: string
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
  }
  approved_attesters?: IAttestationTypesToArr
  approved_requesters?: IAttestationTypesToArr
  attester_rewards?: IAttestationTypesToStr
  webhook_host: string
  webhook_key: string
  log_level?: string
}

export interface IAttestationTypesToArr {
  any?: string
  all?: string[]
  phone?: string[]
  email?: string[]
  sanctionScreen?: string[]
  facebook?: string[]
  pepScreen?: string[]
  idDocument?: string[]
  google?: string[]
  linkedin?: string[]
  twitter?: string[]
}

export interface IAttestationTypesToStr {
  all?: string
  phone?: string
  email?: string
  sanctionScreen?: string
  facebook?: string
  pepScreen?: string
  idDocument?: string
  google?: string
  linkedin?: string
  twitter?: string
}

interface IWhisperTopics {
  phone: string
  email: string
  sanctionScreen: string
  facebook: string
  pepScreen: string
  idDocument: string
  google: string
  linkedin: string
  twitter: string
}

// Throw an error if the specified environment variable is not defined
function envVar(name: string, json = false): any {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Expected environment variable ${name}`)
  }
  return json ? JSON.parse(value) : value
}

function optionalEnvVar(name: string, json: boolean): any | undefined {
  const value = process.env[name]
  if (!value) {
    return undefined
  }
  return json ? JSON.parse(value) : value
}

function getPort(): number {
  const port = process.env.PORT
  if (!port) {
    return 5000
  }

  return toNumber(port)
}

// Topics shouldn't be number but string
const topics = envVar('WHISPER_TOPICS', true)

Object.keys(topics).forEach(k => {
  topics[k] = topics[k].toString()
})

export const env: IEnvironmentConfig = {
  apiKey: envVar('API_KEY_SHA256'),
  dbUrl: envVar('BLOOM_WHISPER_PG_URL'),
  rinkebyAccountRegistryAddress: envVar('RINKEBY_ACCOUNT_REGISTRY_ADDRESS'),
  appPort: getPort(),
  nodeEnv: envVar('NODE_ENV'),
  bltAddress: envVar('BLT_ADDRESS'),
  web3Provider: envVar('WEB3_PROVIDER'),
  rinkebyWeb3Provider: envVar('RINKEBY_WEB3_PROVIDER'),
  sentryDSN: envVar('SENTRY_DSN'),
  tokenEscrowMarketplace: {
    address: envVar('TOKEN_ESCROW_MARKETPLACE_ADDRESS'),
  },
  attestationContracts: {
    repoAddress: envVar('ATTESTATION_REPO_ADDRESS'),
    logicAddress: envVar('ATTESTATION_LOGIC_ADDRESS'),
  },
  owner: {
    ethAddress: envVar('PRIMARY_ETH_ADDRESS'),
    ethPrivKey: envVar('PRIMARY_ETH_PRIVKEY'),
  },
  whisper: {
    provider: envVar('WHISPER_PROVIDER'),
    password: envVar('WHISPER_PASSWORD'),
    topics: topics,
  },
  approved_attesters: optionalEnvVar('APPROVED_ATTESTERS', true),
  approved_requesters: optionalEnvVar('APPROVED_REQUESTERS', true),
  attester_rewards: envVar('ATTESTER_MIN_REWARDS', true),
  webhook_host: envVar('WEBHOOK_HOST'),
  webhook_key: envVar('WEBHOOK_KEY'),
  log_level: optionalEnvVar('LOG_LEVEL', false),
}
