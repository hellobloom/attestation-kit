'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      create table "config" (
        "key" varchar(256) primary key not null,
        "value" jsonb
      );
    `)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      drop table "config";
    `)
  },
}
