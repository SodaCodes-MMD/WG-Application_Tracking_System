const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_application';

// Allowed CORS origins - defaults to localhost development URLs
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:8080'];

// CORS configuration with specific origins
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

// Rate limiting for forgot-password endpoint (5 requests per 15 minutes)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as the rate limit key
    return req.ip || req.connection.remoteAddress;
  }
});

// Middleware
app.use(express.json());

// Routes
// Apply rate limiter specifically to forgot-password endpoint
const authRouterWithLimit = express.Router();
authRouterWithLimit.use('/forgot-password', forgotPasswordLimiter);
authRouterWithLimit.use('/', authRoutes);
app.use('/api/auth', authRouterWithLimit);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Only start the server if this file is run directly (not when imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;