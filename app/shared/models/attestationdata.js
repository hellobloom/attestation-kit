'use strict';
module.exports = (sequelize, DataTypes) => {
  var AttestationData = sequelize.define('AttestationData', {
    datatype: DataTypes.STRING,
    data_text: DataTypes.TEXT,
    data_blob: DataTypes.BLOB,
    challenge: DataTypes.TEXT,
    attestation_id: DataTypes.UUID
  }, {});
  AttestationData.associate = function(models) {
    // associations can be defined here
  };
  return AttestationData;
};