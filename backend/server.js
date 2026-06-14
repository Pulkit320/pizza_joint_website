/**
 * @file        server.js
 * @module      Server
 * @description Main entry point for the Express backend server (local development).
 *              Imports the configured app from app.js and starts the HTTP listener.
 *              // app.js: the Express app itself — used by both local dev (server.js)
 *              // and production (api/index.js on Vercel)
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

const dotenv = require('dotenv');
// Import the centralized app configuration
// app.js: the Express app itself — used by both local dev (server.js)
// and production (api/index.js on Vercel)
const app = require('./src/app');

// Load environment variables
dotenv.config();

const port = process.env.PORT || 3000;

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

// CHANGED FOR VERCEL: Only call listen() if run directly. Otherwise, export the app for serverless or test run.
if (require.main === module) {
  startServer();
}

module.exports = app;
