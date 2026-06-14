/**
 * @file        index.js
 * @module      api
 * @description Serverless entry point for Vercel. Wraps the existing
 *              Express app so all existing routes, middleware, 
 *              controllers, and services work unchanged.
 * @author      Deployment Agent
 * @version     1.0.0
 */

const app = require('../src/app');
module.exports = app;
