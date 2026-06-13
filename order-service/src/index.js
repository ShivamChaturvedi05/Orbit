require('dotenv').config();
const express = require('express');
const { connectDB } = require('./db');
const { connectRabbitMQ } = require('./rabbitmq/producer');
const orderRoutes = require('./routes/order.routes');

const app = express();
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
  });
};

startServer();
