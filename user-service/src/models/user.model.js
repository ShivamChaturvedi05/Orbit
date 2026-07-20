const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stripeAccountId: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = User;
