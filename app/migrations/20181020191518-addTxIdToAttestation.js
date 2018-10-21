'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE "attestations"
      ADD COLUMN tx_id INT NULL;

    COMMIT;
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE "attestations"
      DROP COLUMN tx_id;

    COMMIT;
    `)
  },
}
