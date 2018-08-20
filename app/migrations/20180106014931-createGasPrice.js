'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      CREATE TABLE "gasPrices" (
        "blockNumber" integer NOT NULL PRIMARY KEY,
        "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
        "safeLow" real NOT NULL CONSTRAINT safeLow_is_positive CHECK ("safeLow" > 0),
        average real NOT NULL,
        fastest real NOT NULL,
        CHECK (average >= "safeLow"),
        CHECK (fastest >= average)
      );
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP TABLE "gasPrices"`)
  },
}
