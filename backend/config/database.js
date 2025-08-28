require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? false : false, // Desabilita logs do Sequelize
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Função para testar a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.connection('PostgreSQL', 'success');
  } catch (error) {
    logger.connection('PostgreSQL', 'error');
    throw error;
  }
};

module.exports = { sequelize, testConnection };
