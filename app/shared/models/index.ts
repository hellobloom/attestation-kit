import {Sequelize} from 'sequelize-typescript'
import * as config from '../../config/database'
import Negotiation from '@shared/models/Attestations/Negotiation'
import NegotiationMsg from '@shared/models/Attestations/NegotiationMsg'
import WhisperFilters from '@shared/models/Attestations/WhisperFilters'
import Attestation from '@shared/models/Attestations/Attestation'
import GasPrice from '@shared/models/GasPrice'
import Ping from '@shared/models/Ping'
import {log} from '@shared/logger'
import {env} from '@shared/environment'

const environmentConfig = {
  ...config[process.env.NODE_ENV as any],
  logging: async (x: string[] | string) => {
    if (typeof x === 'string') {
      log(`DB. ${x}`)
      return
    }
    if (((await env()).logs as any).sqlVerbose) {
      // Not defined yet
      log(`DB, ${JSON.stringify(x)}`)
    } else {
      log(`DB: ${x[0]}`)
    }
  },
}

let sequelize: Sequelize

// Configure Sequelize using an environment variable or via JSON config depending on ENV
if (environmentConfig.use_env_variable) {
  const environmentUri = process.env[environmentConfig.use_env_variable]
  if (!environmentUri) {
    throw new Error(
      `Expected to find a database URI at ${environmentConfig.use_env_variable}`
    )
  }
  sequelize = new Sequelize({url: environmentUri, ...environmentConfig})
} else {
  sequelize = new Sequelize(environmentConfig)
}

// Register models with sequelize. We need to do this for all models in the project
sequelize.addModels([
  Negotiation,
  NegotiationMsg,
  WhisperFilters,
  Attestation,
  GasPrice,
  Ping,
])

// Models should be imported from this file. Importing from the model file itself seems
// to require adding a `sequelize.addModels` call at the bottom of each source file.
// Easier to consolidate that here
export {
  Negotiation,
  NegotiationMsg,
  sequelize,
  WhisperFilters,
  Attestation,
  GasPrice,
  Ping,
}
