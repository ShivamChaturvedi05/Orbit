const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to the same PostgreSQL server as the User Service
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected for Order Service...');

    // Auto-create or alter the Orders table
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
