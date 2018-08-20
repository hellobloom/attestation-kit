import {Sequelize} from 'sequelize-typescript'
import {env} from '@shared/environment'
import * as config from '../../config/database'
import Negotiation from '@shared/models/Attestations/Negotiation'
import NegotiationMsg from '@shared/models/Attestations/NegotiationMsg'
import WhisperFilters from '@shared/models/Attestations/WhisperFilters'
import Attestation from '@shared/models/Attestations/Attestation'
import GasPrice from '@shared/models/GasPrice'

const environmentConfig = config[env.nodeEnv]
let sequelize: Sequelize

// Configure Sequelize using an environment variable or via JSON config depending on ENV
if (environmentConfig.use_env_variable) {
  const environmentUri = process.env[environmentConfig.use_env_variable]
  if (!environmentUri) {
    throw new Error(
      `Expected to find a database URI at ${environmentConfig.use_env_variable}`
    )
  }
  sequelize = new Sequelize(environmentUri)
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
}
