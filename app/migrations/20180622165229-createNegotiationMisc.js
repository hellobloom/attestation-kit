'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `)
    await queryInterface.sequelize.query(`
      drop type if exists enum_whisper_msg_types;
      create type "enum_whisper_msg_types"
        as ENUM('storeSolicitation','storeAttestationBid','storeAwaitSubjectData','storeSendJobDetails','storeStartAttestation');
      
      CREATE DOMAIN whisper_topic
      AS bytea
      CONSTRAINT topic_length
      CHECK (octet_length(VALUE) = 4);

      CREATE DOMAIN blt
      AS NUMERIC(28, 18)
      CONSTRAINT non_negative
      CHECK (VALUE >= 0);
    `)

    await queryInterface.createTable('negotiations', {
      id: {
        primaryKey: true,
        autoIncrement: false,
        type: Sequelize.DataTypes.UUID,
      },
      createdAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      initialReward: {
        allowNull: false,
        type: 'blt',
        // type: Sequelize.DataTypes.NUMERIC(28, 18),
      },
      attestationTopic: {
        allowNull: true,
        type: 'whisper_topic',
      },
      attestationId: {
        allowNull: true,
        type: Sequelize.DataTypes.UUID,
      },
    })

    await queryInterface.createTable('negotiationMsgs', {
      createdAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      uuid: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.DataTypes.UUID,
        defaultValue: queryInterface.sequelize.fn('uuid_generate_v4'),
      },
      regardingUuid: {
        allowNull: true,
        type: Sequelize.DataTypes.UUID,
      },
      negotiationId: {
        allowNull: false,
        type: Sequelize.DataTypes.UUID,
      },
      futureTopic: {
        // topics are strings representing 4 byte topic - alternate choices are BLOB, INTEGER
        allowNull: true,
        type: 'whisper_topic',
        // type: Sequelize.DataTypes.STRING,
      },
      messageType: {
        allowNull: false,
        type: 'enum_whisper_msg_types',
      },
      bid: {
        allowNull: true,
        type: 'blt',
        // type: Sequelize.DataTypes.NUMERIC(28, 18),
      },
      replyTo: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
    })

    await queryInterface.sequelize.query(`
      ALTER TABLE "negotiationMsgs" ADD UNIQUE ("regardingUuid", "negotiationId", "messageType");
      `)

    await queryInterface.createTable('whisperFilters', {
      createdAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: 'TIMESTAMP WITHOUT TIME ZONE',
        defaultValue: queryInterface.sequelize.fn('NOW'),
      },
      filterId: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      keypairId: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      topic: {
        allowNull: false,
        type: 'whisper_topic',
      },
      entity: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('negotiationMsgs')
    await queryInterface.dropTable('whisperFilters')
    await queryInterface.dropTable('negotiations')
    await queryInterface.sequelize.query('drop domain if exists "whisper_topic";')
    await queryInterface.sequelize.query('drop domain if exists "blt";')
    await queryInterface.sequelize.query('drop type "enum_whisper_msg_types";')
  },
}
