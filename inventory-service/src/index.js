require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db/index');

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  // Connect to MongoDB and Redis before starting the server
  await connectDB();
  
  // Start the RabbitMQ Consumer to listen for incoming Orders
  const { startRabbitMQConsumer } = require('./rabbitmq/consumer');
  await startRabbitMQConsumer();
  
  app.listen(PORT, () => {
    console.log(`Inventory Service running on port ${PORT}`);
  });
};

startServer();
