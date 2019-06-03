'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

      create table "batchTree" (
        id serial primary key not null,
        "createdAt" timestamp with time zone not null default current_timestamp,
        "updatedAt" timestamp with time zone not null default current_timestamp,
        "root" bytea
          not null
          unique
          check ( octet_length(root) = 32 )
      );
    
      create table "batchQueue" (
        id serial primary key not null,
        "createdAt" timestamp with time zone not null default current_timestamp,
        "updatedAt" timestamp with time zone not null default current_timestamp,
        "batchLayer2Hash" bytea
          not null
          unique
          check ( octet_length("batchLayer2Hash") = 32 ),
        status varchar(20) not null check (status in ('enqueued', 'processing', 'submitted')) default 'enqueued',

        "treeId" integer references "batchTree"
      );

    COMMIT;
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    BEGIN TRANSACTION;

      drop table "batchQueue";
      drop table "batchTree";

    COMMIT;
    `)
  },
}
