const { Redis } = require('ioredis');

// Shared Redis connection used by BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6380', {
  maxRetriesPerRequest: null // Required by BullMQ
});

connection.on('connect', () => console.log('Payment Service connected to Redis for BullMQ'));
connection.on('error', (err) => console.error('Redis connection error in Payment Service:', err));

module.exports = { connection };
