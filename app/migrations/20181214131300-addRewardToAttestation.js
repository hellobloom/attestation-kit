'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE "attestations"
      ADD COLUMN reward blt NULL;

    UPDATE "attestations" a
      SET reward = subquery.bid
    FROM (SELECT bid, "negotiationId", "messageType"
      FROM "negotiationMsgs" n
      WHERE n."messageType" = 'storeAttestationBid'
    ) as subquery
    WHERE a."negotiationId" = subquery."negotiationId"
      AND a.role = 'attester';

    COMMIT;
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

    ALTER TABLE "attestations"
      DROP COLUMN reward;

    COMMIT;
    `)
  },
}
