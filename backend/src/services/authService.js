/**
 * @file        authService.js
 * @module      AuthService
 * @description Authentication service managing registration, login, logout, and token validation.
 * @layer       service
 * @author      Antigravity
 * @version     1.0.0
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');
const loyaltyModel = require('../models/loyaltyModel');
const { pool } = require('../config/db');
const ErrorCodes = require('../utils/errorCodes');
const tokenBlacklist = require('../utils/tokenBlacklist');

class AuthService {
  /**
   * @function  registerCustomer
   * @summary   Registers a new customer, sets up their loyalty account and optional referral
   * @param     {object}  registrationData  - Customer details for registration
   * @returns   {Promise<object>} The registered customer details
   * @throws    {Error} If the email is taken or registration fails
   */
  async registerCustomer(registrationData) {
    const { firstName, lastName, email, password, dateOfBirth, referredBy } = registrationData;

    // Check if email already exists in customers or employees
    const existingCust = await authModel.findCustomerByEmail(email);
    const existingEmp = await authModel.findEmployeeByEmail(email);
    if (existingCust || existingEmp) {
      const error = new Error('Email is already registered.');
      error.statusCode = 409;
      error.code = ErrorCodes.CONFLICT;
      throw error;
    }

    // Check if referrer exists if referredBy is passed
    if (referredBy) {
      const referrer = await authModel.findCustomerById(referredBy);
      if (!referrer) {
        const error = new Error('Referrer customer not found.');
        error.statusCode = 400;
        error.code = ErrorCodes.BAD_REQUEST;
        throw error;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Run customer creation, loyalty account creation, and referral mapping in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const customer = await authModel.createCustomer({
        firstName,
        lastName,
        email,
        passwordHash,
        dateOfBirth,
        referredBy,
      }, client);

      // Create loyalty account (tier_anniversary_date set to 1 year from now)
      const loyaltySql = `
        INSERT INTO loyalty_accounts (customer_id, current_balance, lifetime_points_earned, current_tier, tier_anniversary_date)
        VALUES ($1, 0, 0, 'dough', CURRENT_DATE + INTERVAL '1 year')
        RETURNING *;
      `;
      await client.query(loyaltySql, [customer.id]);

      // If referredBy is present, create the referral record
      if (referredBy) {
        const referralSql = `
          INSERT INTO referrals (referrer_customer_id, referred_customer_id)
          VALUES ($1, $2);
        `;
        await client.query(referralSql, [referredBy, customer.id]);
      }

      await client.query('COMMIT');
      
      // Remove password hash from response object
      delete customer.password_hash;
      return customer;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * @function  loginCustomerUser
   * @summary   Verifies customer credentials and generates a JWT token with customer payload
   * @param     {string}  email     - Customer email
   * @param     {string}  password  - Plain text password
   * @returns   {Promise<object>} The signed JWT token and customer user object
   */
  async loginCustomerUser(email, password) {
    const customer = await authModel.findCustomerByEmail(email);
    if (!customer) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    // Retrieve customer loyalty details
    const loyaltyAccount = await loyaltyModel.findAccountByCustomerId(customer.id);
    const tier = loyaltyAccount ? loyaltyAccount.current_tier : 'dough';
    const loyaltyBalance = loyaltyAccount ? loyaltyAccount.current_balance : 0;

    // Generate JTI and sign token
    const secret = process.env.JWT_SECRET || 'super_secret_dev_pizza_token_key_12345';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      {
        userId: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        role: 'customer',
        tier,
        loyaltyBalance,
        jti
      },
      secret,
      { expiresIn }
    );

    return {
      token,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        role: 'customer',
        tier,
        loyaltyBalance
      }
    };
  }

  /**
   * @function  loginStaffUser
   * @summary   Verifies staff credentials and generates a JWT token with staff payload
   * @param     {string}  email     - Staff email
   * @param     {string}  password  - Plain text password
   * @returns   {Promise<object>} The signed JWT token and staff user object
   */
  async loginStaffUser(email, password) {
    const employee = await authModel.findEmployeeByEmail(email);
    if (!employee) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    // Determine admin privilege (true for manager/admin roles)
    const isAdmin = employee.role === 'manager' || employee.role === 'admin';

    // Generate JTI and sign token
    const secret = process.env.JWT_SECRET || 'super_secret_dev_pizza_token_key_12345';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      {
        userId: employee.id,
        email: employee.email,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.role,
        isAdmin,
        jti
      },
      secret,
      { expiresIn }
    );

    return {
      token,
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.first_name,
        lastName: employee.last_name,
        role: employee.role,
        isAdmin
      }
    };
  }

  /**
   * @function  loginUser
   * @summary   [DEPRECATED] Verifies user credentials and generates a JWT token.
   *            Provided for backward compatibility. Use loginCustomerUser or loginStaffUser.
   * @param     {string}  email     - User email
   * @param     {string}  password  - Plain text password
   * @returns   {Promise<object>} The signed JWT token and user object
   */
  async loginUser(email, password) {
    let userRecord = null;
    let mappedRole = 'customer';
    let isEmployee = false;

    const employee = await authModel.findEmployeeByEmail(email);
    if (employee) {
      userRecord = employee;
      mappedRole = employee.role === 'admin' ? 'admin' : 'staff';
      isEmployee = true;
    } else {
      const customer = await authModel.findCustomerByEmail(email);
      if (customer) {
        userRecord = customer;
        mappedRole = 'customer';
      }
    }

    if (!userRecord) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_dev_pizza_token_key_12345';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      { id: userRecord.id, role: mappedRole, jti },
      secret,
      { expiresIn }
    );

    return {
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        role: mappedRole,
      },
    };
  }

  /**
   * @function  blacklistToken
   * @summary   Blacklists a token to log the user out using JTI blacklist
   * @param     {string}  token  - JWT token to invalidate
   * @returns   {Promise<void>}
   */
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) {
        // CHANGED FOR VERCEL: extract token expiration to store in DB
        const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await tokenBlacklist.add(decoded.jti, expiresAt);
      }
    } catch (err) {
      console.error('Failed to blacklist token:', err);
    }
  }

  /**
   * @function  isTokenBlacklisted
   * @summary   Checks if a token has been blacklisted using JTI blacklist
   * @param     {string}  token  - JWT token to check
   * @returns   {Promise<boolean>} True if the token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) {
        return await tokenBlacklist.has(decoded.jti);
      }
    } catch (err) {
      console.error('Failed to check blacklisted token:', err);
    }
    return false;
  }
}

module.exports = new AuthService();
