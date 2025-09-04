require('dotenv').config();

// --- Core Dependencies ---
const path = require('path');

// --- Third-Party Libraries ---
const express = require('express');
const session = require('express-session');

// Simple memory store for sessions (works 100% of the time)
console.log('⚡ Using memory store for sessions (simple and reliable)');

const helmet = require('helmet');

// --- Local Modules & Configuration ---
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models/Index');
const logger = require('./config/logger');
const scheduler = require('./config/scheduler');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

// --- Server Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// ===============================================================
// --- CORE MIDDLEWARES ---
// ===============================================================

// 1. Security Middleware (Helmet)
app.use(
  helmet({
    hsts: process.env.NODE_ENV === 'production',
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'"
        ],
        styleSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
          "'unsafe-inline'"
        ],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://picsum.photos", "https://fastly.picsum.photos"],
        scriptSrcAttr: [],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null
      },
    }
  })
);

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 4. Session Management with simple memory store (reliable)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production-12345',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: false, // Allow HTTP for now to ensure login works
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// 5. Static File Serving & URL Prettifying
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && req.path.length > 5) {
    const newPath = req.path.slice(0, -5) === '/index' ? '/' : req.path.slice(0, -5);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, newPath + query);
  }
  next();
});

// Serve static files from frontend directory
app.use('/public', express.static(path.join(__dirname, '../frontend/public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
  etag: true,
  lastModified: true
}));

// Serve frontend HTML files
app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false,
  extensions: ['html']
}));

// ===============================================================
// --- ROUTES ---
// ===============================================================

app.use('/', webRoutes);
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  logger.warn('404 Not Found', { url: req.originalUrl });
  res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===============================================================
// --- SERVER STARTUP ---
// ===============================================================

async function startServer() {
  try {
    logger.info('🚀 Starting CodeSeek server...');

    // Test database connection
    await testConnection();
    logger.info('✅ Database connection established');

    // Sync database models
    await syncDatabase();
    logger.info('✅ Database models synchronized');

    // Start scheduler
    scheduler.start();
    logger.info('✅ Scheduler started');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`✅ CodeSeek server is running on port ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📍 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();