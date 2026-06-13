/**
 * @file        app.js
 * @module      App
 * @description Configures and exports the main Express application.
 *              Used by both server.js (local dev) and api/index.js (Vercel production).
 *              CHANGED FOR VERCEL: app.listen() moved to server.js (local dev only).
 *              This file now only builds and exports the app — Vercel's
 *              serverless runtime calls it directly without listen().
 * @layer       config
 * @author      Deployment Agent
 * @version     1.0.0
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const eotwRoutes = require('./routes/eotwRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/employees', eotwRoutes);
app.use('/api/v1/admin', adminRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Centralized error handling middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
