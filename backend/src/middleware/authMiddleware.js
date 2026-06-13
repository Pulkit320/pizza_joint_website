/**
 * @file        authMiddleware.js
 * @module      AuthMiddleware
 * @description Authentication middleware checking JWT validity and role-based permissions.
 * @layer       middleware
 * @author      Antigravity
 * @version     1.0.0
 */

const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const tokenBlacklist = require('../utils/tokenBlacklist');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  authenticateToken
 * @summary   Express middleware checking authorization header for valid JWT
 * @param     {object}    req   - Express request object
 * @param     {object}    res   - Express response object
 * @param     {function}  next  - Express next middleware function
 * @returns   {void}
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Access denied. No token provided.',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  const secret = process.env.JWT_SECRET || 'super_secret_dev_pizza_token_key_12345';
  try {
    const decoded = jwt.verify(token, secret);

    // CHANGED FOR VERCEL: Await database queries for token blacklist check
    const isBlacklisted = (decoded.jti && await tokenBlacklist.has(decoded.jti)) || await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Token has been invalidated (logged out).',
        },
      });
    }

    req.user = decoded;
    req.token = token; // store token in req for logout invalidation
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid or expired token.',
      },
    });
  }
}

/**
 * @function  requireRole
 * @summary   Express middleware generator enforcing role authorization rules.
 *            Accepts a single role string or an array of role strings.
 * @param     {string|string[]}  roles  - The required role(s) ('guest' | 'customer' | 'staff' | 'admin' | specific staff roles)
 * @returns   {function} Express middleware function
 */
function requireRole(roles) {
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (rolesArray.includes('guest')) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Authentication required.',
        },
      });
    }

    const userRole = req.user.role;

    // Check if the user's role is in the allowed roles.
    const isAllowed = rolesArray.some(role => {
      if (role === 'admin') {
        return userRole === 'admin' || userRole === 'manager';
      }
      if (role === 'staff') {
        return ['server', 'delivery_driver', 'chef', 'cashier', 'manager', 'cook', 'driver', 'admin'].includes(userRole);
      }
      return userRole === role;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: `Access forbidden. Required role: ${rolesArray.join(', ')}`,
        },
      });
    }

    next();
  };
}

/**
 * @function  requireAdminRole
 * @summary   Express middleware enforcing admin-level authorization (admin or manager role, or isAdmin flag)
 * @param     {object}    req   - Express request object
 * @param     {object}    res   - Express response object
 * @param     {function}  next  - Express next middleware function
 * @returns   {void}
 */
function requireAdminRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      },
    });
  }

  const userRole = req.user.role;
  if (userRole === 'admin' || userRole === 'manager' || req.user.isAdmin === true) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: ErrorCodes.FORBIDDEN,
      message: 'Access forbidden. Admin-level access required.',
    },
  });
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdminRole,
};
