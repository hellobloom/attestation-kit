'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      CREATE TYPE "attestation_data_datatype"
        AS ENUM('text','blob');

      CREATE TABLE "attestationData" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created" timestamp without time zone DEFAULT now() NOT NULL,
        "updated" timestamp without time zone DEFAULT now() NOT NULL,

        "attestationId" uuid,
        "messageType" enum_whisper_msg_types,

        "datatype" attestation_data_datatype,
        "dtext" text,
        "dblob" blob,

        "challenge" varchar(256)
      );
    `)
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      drop table AttestationData;
      drop type attestation_data_datatype;
    `)
  },
}
