'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('AttestationData', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      datatype: {
        type: Sequelize.STRING
      },
      data_text: {
        type: Sequelize.TEXT
      },
      data_blob: {
        type: Sequelize.BLOB
      },
      challenge: {
        type: Sequelize.TEXT
      },
      attestation_id: {
        type: Sequelize.UUID
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('AttestationData');
  }
};