'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE attestations
      ADD COLUMN version VARCHAR NOT NULL DEFAULT 'v1';

    COMMIT;
    `)

    await queryInterface.sequelize.query(`
    ALTER TYPE enum_whisper_msg_types ADD VALUE 'storeSendPaymentAuthorization';
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE attestations
      DROP COLUMN version;

    COMMIT;
    `)
  },
}
