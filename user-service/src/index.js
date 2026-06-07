require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db/index');
const { sequelize } = require('./models/index'); // Imports models and relations

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  
  try {
    // Sync models (creates tables automatically if they don't exist)
    await sequelize.sync();
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }

  app.listen(PORT, () => {
    console.log(`User Service running securely on port ${PORT}`);
  });
};

startServer();
