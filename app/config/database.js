const {Sequelize} = require('sequelize-typescript/lib/models/Sequelize')
require('babel-register')

module.exports = {
  development: {
    use_env_variable: 'BLOOM_WHISPER_PG_URL',
    dialect: 'postgres',
  },
  test: {
    use_env_variable: 'BLOOM_WHISPER_PG_URL',
    dialect: 'postgres',
  },
  production: {
    use_env_variable: 'BLOOM_WHISPER_PG_URL',
    dialect: 'postgres',
  },
}
