'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      alter type enum_whisper_msg_types add value 'ping';
    `)
    await queryInterface.sequelize.query(`
      alter type enum_whisper_msg_types add value 'pong';
    `)
    await queryInterface.sequelize.query(`
      create table "whisper_pings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created" timestamp without time zone default now() not null,
        "updated" timestamp without time zone default now() not null,
        "answered" boolean not null default false
      );
    `)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      drop table "whisper_pings" (
    `)
  },
}
