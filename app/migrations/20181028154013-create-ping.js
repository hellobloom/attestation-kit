'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      create table "whisper_pings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created" timestamp without time zone DEFAULT now() NOT NULL,
        "updated" timestamp without time zone DEFAULT now() NOT NULL,
        "responder" ethereum_address
      );
    `)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      drop table "whisper_pings" (
    `)
  },
}
