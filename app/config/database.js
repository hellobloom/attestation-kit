const {Sequelize} = require('sequelize-typescript/lib/models/Sequelize')
const fs = require('fs')
require('babel-register')

const debDb = 'attestation-kit'
const devPassword = fs.readFileSync(`/run/secrets/${debDb}`).toString().trim()
module.exports = {
  development: {
    dbUrl: `postgres://${debDb}:${devPassword}@debugpg/${debDb}`,
    username: debDb,
    user: debDb,
    password: devPassword,
    database: debDb,
    host: 'debugpg',
    dialect: 'postgres',
  },
  test: {
    dbUrl: process.env.PG_URL,
    dialect: 'postgres',
  },
  production: {
    dbUrl: process.env.PG_URL,
    dialect: 'postgres',
  },
}
