'use strict';
module.exports = (sequelize, DataTypes) => {
  var Ping = sequelize.define('Ping', {
    id: DataTypes.UUID,
    created: DataTypes.DATETIME
  }, {});
  Ping.associate = function(models) {
    // associations can be defined here
  };
  return Ping;
};