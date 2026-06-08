require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db/index');

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  // Connect to MongoDB and Redis before starting the server
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Inventory Service running on port ${PORT}`);
  });
};

startServer();
