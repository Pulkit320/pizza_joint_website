/**
 * @file        errorCodes.js
 * @module      ErrorCodes
 * @description Standard error code constants for the application.
 * @layer       util
 * @author      Antigravity
 * @version     1.0.0
 */

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFLICT: 'CONFLICT',

  // Loyalty Program Error Codes
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  INVALID_REDEMPTION: 'INVALID_REDEMPTION',

  // Reviews Error Codes
  ORDER_NOT_COMPLETED: 'ORDER_NOT_COMPLETED',
  REVIEW_WINDOW_EXPIRED: 'REVIEW_WINDOW_EXPIRED',
  INVALID_EMPLOYEE_RATING: 'INVALID_EMPLOYEE_RATING',
  DUPLICATE_REVIEW: 'DUPLICATE_REVIEW',
};

module.exports = ErrorCodes;
