const { Redis } = require('ioredis');

// Shared Redis connection used by BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null // Required by BullMQ
});

connection.on('connect', () => console.log('Payment Service connected to Redis for BullMQ'));
connection.on('error', (err) => console.error('Redis connection error in Payment Service:', err));

module.exports = { connection };
