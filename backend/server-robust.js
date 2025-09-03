require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');
const path = require('path');

// Import configurations with error handling
let redisClient, sequelize, logger;

try {
  logger = require('./config/logger');
  logger.info('Logger initialized successfully');
} catch (error) {
  console.error('Failed to initialize logger:', error.message);
  // Fallback logger
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    connection: (service, status) => console.log(`${service}: ${status}`)
  };
}

try {
  const { sequelize: seq } = require('./config/database');
  sequelize = seq;
  logger.info('Database configuration loaded');
} catch (error) {
  logger.error('Failed to load database configuration:', error.message);
}

try {
  redisClient = require('./config/redis');
  logger.info('Redis configuration loaded');
} catch (error) {
  logger.error('Failed to load Redis configuration:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://picsum.photos", "https://fastly.picsum.photos"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    },
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Session management with fallback
if (redisClient) {
  try {
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: 'digisess:',
    });
    
    app.use(session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      name: 'connect.sid',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    }));
    
    logger.info('Redis session store configured');
  } catch (error) {
    logger.error('Failed to configure Redis session store:', error.message);
    // Fallback to memory store
    app.use(session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      name: 'connect.sid',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    }));
    logger.warn('Using memory session store as fallback');
  }
} else {
  // Memory store fallback
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));
  logger.warn('Redis not available, using memory session store');
}

// Routes
try {
  const apiRoutes = require('./routes/api');
  const webRoutes = require('./routes/web');
  
  app.use('/api', apiRoutes);
  app.use('/', webRoutes);
  logger.info('Routes loaded successfully');
} catch (error) {
  logger.error('Failed to load routes:', error.message);
  // Continue without routes for basic health check
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const result = { 
    api: 'ok', 
    db: 'unknown', 
    redis: 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Test Database
  if (sequelize) {
    try {
      await sequelize.authenticate();
      result.db = 'ok';
    } catch (e) {
      result.db = 'error';
      logger.error('Database health check failed:', e.message);
    }
  } else {
    result.db = 'not_configured';
  }
  
  // Test Redis
  if (redisClient) {
    try {
      if (redisClient?.isOpen || redisClient?.connected) {
        result.redis = 'ok';
      } else {
        await redisClient.connect().catch(() => {});
        result.redis = (redisClient?.isOpen || redisClient?.connected) ? 'ok' : 'error';
      }
    } catch (e) {
      result.redis = 'error';
      logger.error('Redis health check failed:', e.message);
    }
  } else {
    result.redis = 'not_configured';
  }
  
  const status = result.db === 'ok' ? 200 : 503;
  return res.status(status).json(result);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'CodeSeek API is running', status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message, err.stack);
  
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
  
  res.status(500).send('Internal Server Error');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    if (sequelize) {
      await sequelize.authenticate();
      logger.info('Database connected successfully');
    }
    
    // Connect to Redis
    if (redisClient && !redisClient.isOpen && !redisClient.connected) {
      await redisClient.connect();
      logger.info('Redis connected successfully');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  
  if (sequelize) {
    await sequelize.close();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  
  if (sequelize) {
    await sequelize.close();
  }
  
  process.exit(0);
});
