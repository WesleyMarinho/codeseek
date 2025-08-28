const { Setting } = require('../models');
const logger = require('./logger');

/**
 * Carrega as configurações do Chargebee do banco de dados
 * @returns {Promise<Object>} Configurações do Chargebee
 */
async function getChargebeeConfig() {
  try {
    const settings = await Setting.findAll({
      where: {
        key: [
          'chargebee_site',
          'chargebee_api_key',
          'chargebee_publishable_key',
          'chargebee_webhook_username',
          'chargebee_webhook_password'
        ]
      }
    });

    const config = {};
    settings.forEach(setting => {
      config[setting.key] = setting.value;
    });

    // Fallback para variáveis de ambiente se não estiver no banco
    return {
      site: config.chargebee_site || process.env.CHARGEBEE_SITE,
      api_key: config.chargebee_api_key || process.env.CHARGEBEE_API_KEY,
      publishable_key: config.chargebee_publishable_key || process.env.CHARGEBEE_PUBLISHABLE_KEY,
      webhook_username: config.chargebee_webhook_username || process.env.CHARGEBEE_WEBHOOK_USERNAME,
      webhook_password: config.chargebee_webhook_password || process.env.CHARGEBEE_WEBHOOK_PASSWORD
    };
  } catch (error) {
    logger.error('Erro ao carregar configurações do Chargebee:', error);
    
    // Fallback para variáveis de ambiente em caso de erro
    return {
      site: process.env.CHARGEBEE_SITE,
      api_key: process.env.CHARGEBEE_API_KEY,
      publishable_key: process.env.CHARGEBEE_PUBLISHABLE_KEY,
      webhook_username: process.env.CHARGEBEE_WEBHOOK_USERNAME,
      webhook_password: process.env.CHARGEBEE_WEBHOOK_PASSWORD
    };
  }
}

/**
 * Inicializa o cliente Chargebee com as configurações do banco de dados
 * @returns {Promise<Object>} Cliente Chargebee configurado
 */
async function initializeChargebee() {
  const chargebee = require('chargebee');
  const config = await getChargebeeConfig();
  
  if (!config.site || !config.api_key) {
    throw new Error('Configurações do Chargebee não encontradas. Verifique as configurações no painel admin.');
  }
  
  chargebee.configure({
    site: config.site,
    api_key: config.api_key
  });
  
  logger.info(`Chargebee inicializado para o site: ${config.site}`);
  return chargebee;
}

module.exports = {
  getChargebeeConfig,
  initializeChargebee
};