const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index');

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
});

module.exports = RefreshToken;
