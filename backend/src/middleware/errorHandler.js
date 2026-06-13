/**
 * @file        errorHandler.js
 * @module      ErrorHandler
 * @description Centralized Express error handling middleware.
 * @layer       middleware
 * @author      Antigravity
 * @version     1.0.0
 */

const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  errorHandler
 * @summary   Express error handling middleware to catch all thrown errors and format response
 * @param     {object}    err   - Express error object
 * @param     {object}    req   - Express request object
 * @param     {object}    res   - Express response object
 * @param     {function}  next  - Express next middleware function
 * @returns   {void}
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code and error code
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || ErrorCodes.INTERNAL_ERROR;
  const message = err.message || 'An unexpected error occurred.';

  // In production/dev, we log the error for monitoring
  console.error(`[Error] Code: ${errorCode}, Status: ${statusCode}, Message: ${message}`);
  if (err.stack && statusCode === 500) {
    console.error(err.stack);
  }

  // Send uniform JSON response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  });
}

module.exports = errorHandler;
