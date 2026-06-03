/**
 * @file        server.js
 * @module      Server
 * @description Main entry point for the Express backend server.
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * @function  startServer
 * @summary   Starts the Express server on the configured port
 * @returns   {void}
 * @throws    {Error} When the server fails to bind to the port
 */
function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

startServer();

module.exports = app;
