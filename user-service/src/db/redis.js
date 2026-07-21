const { Redis } = require('ioredis');

// Shared Redis connection for user-service
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => console.log('User Service connected to Redis'));
redisClient.on('error', (err) => console.error('Redis connection error in User Service:', err));

module.exports = redisClient;
