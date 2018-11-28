'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    ALTER TYPE enum_whisper_msg_types ADD VALUE 'storeSendPaymentAuthorization';
    `)
  },

  down: async (queryInterface, Sequelize) => {
    // todo rebuild enum_whisper_msg_types without 'storeSendPaymentAuthorization'
  },
}
