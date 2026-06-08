const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

// 1. Setup Redis Client
const redisClient = createClient({ url: process.env.REDIS_URL });

// Redis Event Listeners for debugging
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Connected Successfully.'));

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully.');

    // Connect to Redis
    await redisClient.connect();
  } catch (error) {
    console.error('Database Connection Error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, redisClient };
