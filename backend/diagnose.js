require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

async function diagnose() {
  console.log('=== PRODUCTION DIAGNOSTIC ===');
  console.log('Node.js version:', process.version);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Test Redis Connection First
  console.log('\n--- Redis Connection Test ---');
  try {
    const redisClient = require('./config/redis');
    
    if (!redisClient.isOpen && !redisClient.connected) {
      console.log('Attempting to connect to Redis...');
      await redisClient.connect();
    }
    
    // Test Redis Store
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: 'digisess:',
    });
    
    console.log('✅ Redis: Connected and Store Created');
    
    // Test Session Middleware
    const app = express();
    app.use(session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || 'test-secret',
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
    
    console.log('✅ Session Middleware: Configured');
    
  } catch (error) {
    console.log('❌ Redis/Session Error:', error.message);
    console.log('Stack:', error.stack);
  }
  
  // Test Database
  console.log('\n--- Database Test ---');
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    console.log('✅ Database: Connected');
  } catch (error) {
    console.log('❌ Database Error:', error.message);
  }
  
  // Test Environment Variables
  console.log('\n--- Environment Variables ---');
  const requiredVars = ['SESSION_SECRET', 'DB_HOST', 'REDIS_HOST'];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.length} chars)`);
    } else {
      console.log(`❌ ${varName}: Missing`);
    }
  });
  
  console.log('\n=== END DIAGNOSTIC ===');
  process.exit(0);
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});