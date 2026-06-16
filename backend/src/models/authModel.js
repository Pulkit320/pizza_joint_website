/**
 * @file        authModel.js
 * @module      AuthModel
 * @description Direct SQL model operations for customers and employees authentication.
 * @layer       model
 * @author      Antigravity
 * @version     1.0.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  findCustomerByEmail
 * @summary   Queries the database for a customer by email
 * @param     {string}  email  - Customer email address
 * @returns   {Promise<object|null>} The customer record or null if not found
 */
async function findCustomerByEmail(email) {
  const sqlText = 'SELECT * FROM customers WHERE email = $1';
  const result = await executeQuery(sqlText, [email]);
  return result.rows[0] || null;
}

/**
 * @function  findEmployeeByEmail
 * @summary   Queries the database for an employee by email
 * @param     {string}  email  - Employee email address
 * @returns   {Promise<object|null>} The employee record or null if not found
 */
async function findEmployeeByEmail(email) {
  const sqlText = 'SELECT * FROM employees WHERE email = $1';
  const result = await executeQuery(sqlText, [email]);
  return result.rows[0] || null;
}

/**
 * @function  findCustomerById
 * @summary   Queries the database for a customer by ID
 * @param     {string}  id  - Customer unique identifier (UUID)
 * @returns   {Promise<object|null>} The customer record or null if not found
 */
async function findCustomerById(id) {
  const sqlText = 'SELECT id, email, first_name, last_name, date_of_birth, referred_by, created_at FROM customers WHERE id = $1';
  const result = await executeQuery(sqlText, [id]);
  return result.rows[0] || null;
}

/**
 * @function  findEmployeeById
 * @summary   Queries the database for an employee by ID
 * @param     {string}  id  - Employee unique identifier (UUID)
 * @returns   {Promise<object|null>} The employee record or null if not found
 */
async function findEmployeeById(id) {
  const sqlText = 'SELECT id, email, first_name, last_name, role, created_at FROM employees WHERE id = $1';
  const result = await executeQuery(sqlText, [id]);
  return result.rows[0] || null;
}

/**
 * @function  createCustomer
 * @summary   Inserts a new customer record into the database
 * @param     {object}  customerData  - Customer registration data
 * @param     {string}  customerData.firstName  - First name
 * @param     {string}  customerData.lastName   - Last name
 * @param     {string}  customerData.email      - Unique email address
 * @param     {string}  customerData.passwordHash - Encrypted password hash
 * @param     {string}  [customerData.dateOfBirth] - Optional birth date (YYYY-MM-DD)
 * @param     {string}  [customerData.referredBy]  - Optional ID of referrer customer (UUID)
 * @param     {object}  [client]  - Optional transaction client
 * @returns   {Promise<object>} The newly created customer record
 */
async function createCustomer(customerData, client) {
  const { firstName, lastName, email, passwordHash, dateOfBirth, referredBy } = customerData;
  const sqlText = `
    INSERT INTO customers (first_name, last_name, email, password_hash, date_of_birth, referred_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, first_name, last_name, date_of_birth, referred_by, created_at;
  `;
  const params = [firstName, lastName, email, passwordHash, dateOfBirth || null, referredBy || null];
  
  const result = client 
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
    
  return result.rows[0];
}

/**
 * @function  updateCustomer
 * @summary   Updates customer details in the database
 * @param     {string}  id            - Customer ID (UUID)
 * @param     {object}  customerData  - Customer updated fields
 * @returns   {Promise<object>} The updated customer record
 */
async function updateCustomer(id, customerData) {
  const { firstName, lastName, email } = customerData;
  const sqlText = `
    UPDATE customers
    SET first_name = $1, last_name = $2, email = $3
    WHERE id = $4
    RETURNING id, email, first_name, last_name, date_of_birth, referred_by, created_at;
  `;
  const result = await executeQuery(sqlText, [firstName, lastName, email, id]);
  return result.rows[0] || null;
}

/**
 * @function  updateEmployee
 * @summary   Updates employee details in the database
 * @param     {string}  id            - Employee ID (UUID)
 * @param     {object}  employeeData  - Employee updated fields
 * @returns   {Promise<object>} The updated employee record
 */
async function updateEmployee(id, employeeData) {
  const { firstName, lastName, email } = employeeData;
  const sqlText = `
    UPDATE employees
    SET first_name = $1, last_name = $2, email = $3
    WHERE id = $4
    RETURNING id, email, first_name, last_name, role, created_at;
  `;
  const result = await executeQuery(sqlText, [firstName, lastName, email, id]);
  return result.rows[0] || null;
}

module.exports = {
  findCustomerByEmail,
  findEmployeeByEmail,
  findCustomerById,
  findEmployeeById,
  createCustomer,
  updateCustomer,
  updateEmployee,
};
