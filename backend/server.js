require('dotenv').config();

// --- Core Dependencies ---
const path = require('path');

// --- Third-Party Libraries ---
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');

// --- Local Modules & Configuration ---
const redisClient = require('./config/redis');
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
// Sets various HTTP headers to help protect the app from common vulnerabilities.
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
        // Avoid inline scripts; styles can allow inline for Tailwind utility overrides
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
        upgradeInsecureRequests: null // Disable upgrade-insecure-requests for development
      },
    }
  })
);

// 2. Body Parsers
// Parses incoming request bodies in JSON and URL-encoded formats.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logger
// Custom middleware to log details of every incoming request.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 4. Session Management (Redis)
// Configures session handling with Redis for persistent storage.
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'digisess:',
});

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// 5. Static File Serving & URL Prettifying
// Serves static assets and removes .html extensions from URLs.
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && req.path.length > 5) {
    const newPath = req.path.slice(0, -5) === '/index' ? '/' : req.path.slice(0, -5);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, newPath + query);
  }
  next();
});

app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Local Variables Middleware
// Injects session user data into res.locals for easier access in views.
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ===============================================================
// --- APPLICATION ROUTES ---
// ===============================================================

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api', apiRoutes);
app.use('/', webRoutes);

// ===============================================================
// --- ERROR HANDLING MIDDLEWARES ---
// ===============================================================

// 1. 404 Not Found Handler
app.use((req, res, next) => {
  const isApiRequest = req.path.startsWith('/api');
  logger.warn(`404 Not Found - ${req.method} ${req.originalUrl}`);
  
  if (isApiRequest) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  
  const message = "The page you're looking for doesn't exist.";
  return res.redirect(`/errors?code=404&message=${encodeURIComponent(message)}`);
});

// 2. 500 Internal Server Error Handler
app.use((err, req, res, next) => {
  const isApiRequest = req.path.startsWith('/api');
  logger.error('Unhandled Application Error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl
  });

  if (isApiRequest) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }

  const message = "Sorry, something went wrong on our end. Please try again later.";
  return res.redirect(`/errors?code=500&message=${encodeURIComponent(message)}`);
});

// ===============================================================
// --- SERVER STARTUP ---
// ===============================================================
const startServer = async () => {
  try {
    await testConnection();
    // Only sync schema automatically if explicitly enabled (default true in development)
    const shouldSync = process.env.DB_SYNC !== 'false';
    if (shouldSync) {
      await syncDatabase();
    }
    await redisClient.connect();
    
    scheduler.init();
    
    app.listen(PORT, () => {
      logger.server(PORT);
    });
    
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Export for testing purposes

