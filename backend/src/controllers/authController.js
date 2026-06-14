/**
 * @file        authController.js
 * @module      AuthController
 * @description Controller handling authentication-related requests.
 * @layer       controller
 * @author      Antigravity
 * @version     1.0.0
 */

const authService = require('../services/authService');
const authModel = require('../models/authModel');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  register
 * @summary   Express route handler for customer registration
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function register(req, res, next) {
  try {
    let { firstName, lastName, email, password, dateOfBirth, referredBy, name } = req.body;
    
    if (name && (!firstName || !lastName)) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (!firstName || !lastName || !email || !password) {
      const error = new Error('Missing required fields.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const customer = await authService.registerCustomer({
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      referredBy,
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  login
 * @summary   Express route handler for user login
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
/**
 * @function  customerLogin
 * @summary   Express route handler for customer login
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function customerLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      const error = new Error('Missing email or password.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const result = await authService.loginCustomerUser(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  staffLogin
 * @summary   Express route handler for staff login
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function staffLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      const error = new Error('Missing email or password.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const result = await authService.loginStaffUser(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  login
 * @summary   [DEPRECATED] Express route handler for user login
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      const error = new Error('Missing email or password.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    console.warn('WARNING: Deprecated endpoint used. Switch to /auth/customer/login or /auth/staff/login.');

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  logout
 * @summary   Express route handler for logging out a user by blacklisting their token
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {void}
 */
function logout(req, res, next) {
  try {
    if (req.token) {
      authService.blacklistToken(req.token);
    }
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  me
 * @summary   Express route handler to retrieve current authenticated user details
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function me(req, res, next) {
  try {
    if (!req.user) {
      const error = new Error('Unauthorized.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    const role = req.user.role;
    const userId = req.user.userId || req.user.id;
    let userDetails = null;

    if (role === 'customer') {
      userDetails = await authModel.findCustomerById(userId);
    } else {
      userDetails = await authModel.findEmployeeById(userId);
    }

    if (!userDetails) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // Attach role to the user details output structure
    res.json({
      success: true,
      data: {
        ...userDetails,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  customerLogin,
  staffLogin,
  login,
  logout,
  me,
};
