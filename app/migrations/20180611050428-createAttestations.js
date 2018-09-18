'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_attestation_txStatus"
        AS ENUM('pending', 'mined', 'failed');
    `)
    await queryInterface.sequelize.query(`
      CREATE TYPE "attestation_status"
        AS ENUM('initial', 'ready', 'complete', 'rejected');
    `)
    await queryInterface.sequelize.query(`
      CREATE TYPE "attestation_type"
        AS ENUM('phone','email','facebook','sanction-screen','pep-screen','id-document','google','linkedin','twitter','payroll','ssn','criminal','offense','driving','employment','education','drug','bank','utility','income','assets');
    `)
    await queryInterface.sequelize.query(`
      CREATE TYPE "attestation_role"
        AS ENUM('requester','attester');
    `)
    await queryInterface.sequelize.query(`
      CREATE DOMAIN ethereum_address
      AS bytea
      CONSTRAINT address_length
      CHECK (octet_length(VALUE) = 20);
    `)
    await queryInterface.sequelize.query(`
      CREATE DOMAIN secp256k1_signature
      AS bytea
      CONSTRAINT signature_length
      CHECK (octet_length(VALUE) = 65 AND (get_byte(VALUE, 64) = 28 OR get_byte(VALUE, 64) = 27));
    `)
    await queryInterface.sequelize.query(`
      CREATE DOMAIN "sha256digest" AS bytea
      CHECK(octet_length(value::bytea) = 32);
    `)
    await queryInterface.sequelize.query(`
      CREATE DOMAIN ethereum_transaction_id
      AS bytea
      CONSTRAINT hash_length
      CHECK ((VALUE = NULL) OR (octet_length(VALUE) = 32));
    `)

    await queryInterface.sequelize.query(`
      CREATE TABLE "attestations" (
        "id" uuid PRIMARY KEY,
        "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,

        "types" INT[],
        "type" attestation_type NOT NULL,
        "status" attestation_status NOT NULL DEFAULT 'initial',

        "attester" ethereum_address,
        "requester" ethereum_address,
        "subject" ethereum_address,
        "role" attestation_role NOT NULL,

        "data" JSONB NULL,
        "result" JSONB NULL,

        "subjectSig" secp256k1_signature,
        "requestNonce" sha256digest NULL,
        "paymentNonce" sha256digest NULL,

        "paymentSig" secp256k1_signature,

        "negotiationId" uuid,
        "attestTx" ethereum_transaction_id,
        "txStatus" "enum_attestation_txStatus" NOT NULL DEFAULT 'pending'
      );
    `)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE "attestations";')
    await queryInterface.sequelize.query(`DROP TYPE "enum_attestation_txStatus";`)
    await queryInterface.sequelize.query('DROP TYPE "attestation_status";')
    await queryInterface.sequelize.query('DROP TYPE "attestation_type";')
    await queryInterface.sequelize.query('DROP TYPE "attestation_role";')
    await queryInterface.sequelize.query(`
      DROP DOMAIN IF EXISTS "ethereum_address";
      DROP DOMAIN IF EXISTS "sha256digest";
      DROP DOMAIN IF EXISTS "secp256k1_signature";
      DROP DOMAIN IF EXISTS ethereum_transaction_id;
    `)
  },
}
