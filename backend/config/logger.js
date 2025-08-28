const winston = require('winston');
const path = require('path');

// Formato para console (limpo e colorido)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: '✅',
      debug: '🔍'
    };
    
    const levelEmoji = emoji[level.replace(/\u001b\[[0-9;]*m/g, '')] || '📝';
    return `${levelEmoji} [${timestamp}] ${message}`;
  })
);

// Formato para arquivos (detalhado)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    // Log de erros em arquivo separado
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log geral
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log de debug (apenas em desenvolvimento)
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/debug.log'),
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  ],
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Função para log de startup limpo
logger.startup = (message) => {
  logger.info(message);
};

// Função para log de conexões
logger.connection = (service, status) => {
  if (status === 'success') {
    logger.info(`${service} conectado`);
  } else {
    logger.error(`Falha ao conectar ${service}`);
  }
};

// Função para log do servidor
logger.server = (port) => {
  logger.info(`Servidor rodando na porta ${port}`);
  logger.info(`Frontend: http://localhost:${port}`);
  logger.info(`API: http://localhost:${port}/api`);
};

// Função para log de requisições HTTP
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.session?.userId || 'anonymous',
    sessionId: req.sessionID
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Função para log de sessões
logger.logSession = (action, sessionData) => {
  logger.info(`Session ${action}`, {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId,
    userEmail: sessionData.userEmail,
    userRole: sessionData.userRole
  });
};

// Função para log de autenticação
logger.logAuth = (action, data) => {
  logger.info(`Auth ${action}`, {
    email: data.email,
    userId: data.userId,
    success: data.success,
    reason: data.reason || null
  });
};

// Função para log de database
logger.logDB = (action, data) => {
  logger.debug(`Database ${action}`, data);
};

module.exports = logger;
