const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productId: {
    type: DataTypes.STRING, // MongoDB IDs are strings
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
  }
}, {
  timestamps: true,
});

module.exports = Order;
