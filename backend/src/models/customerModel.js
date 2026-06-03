/**
 * @file        customerModel.js
 * @module      CustomerModel
 * @description Direct SQL model operations for the customer entity.
 * @layer       model
 * @author      Architect Agent
 * @version     1.0.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  findCustomerById
 * @summary   Queries the database for a customer by their unique ID
 * @param     {number}  customerId  - The unique ID of the customer
 * @returns   {Promise<object|null>} The customer record object or null if not found
 * @throws    {Error} When the database query fails
 */
async function findCustomerById(customerId) {
  const sqlText = 'SELECT id, email, first_name, last_name FROM customers WHERE id = $1';
  const result = await executeQuery(sqlText, [customerId]);
  return result.rows[0] || null;
}

module.exports = {
  findCustomerById,
};
