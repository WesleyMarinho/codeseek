// backend/config/redis.js - VERSÃO CORRIGIDA
const redis = require('redis');
const logger = require('./logger');

// Cria o cliente de uma forma mais robusta, sem depender de uma URL montada manualmente.
// Isso lida corretamente com a ausência de usuário ou senha.
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  // A biblioteca lida com senhas vazias ou nulas automaticamente
  password: process.env.REDIS_PASSWORD
});

redisClient.on('connect', () => logger.info('Connecting to Redis...'));
redisClient.on('ready', () => logger.info('Redis connected successfully.'));
redisClient.on('error', (err) => logger.error('Redis connection error:', err));
redisClient.on('reconnecting', () => logger.warn('Reconnecting to Redis...'));
redisClient.on('end', () => logger.warn('Redis connection closed.'));

module.exports = redisClient;
