require('dotenv').config();
const redis = require('redis');
const logger = require('./logger');

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_USER || ''}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  legacyMode: true, // Importante para compatibilidade com connect-redis
  socket: {
    connectTimeout: 50000,
    reconnectStrategy: retries => Math.min(retries * 50, 2000)
  }
});

redisClient.on('connect', () => {
  logger.connection('Redis', 'success');
});

redisClient.on('error', (err) => {
  logger.connection('Redis', 'error');
});

module.exports = redisClient;
