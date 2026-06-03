/**
 * @file        db.js
 * @module      DatabaseConfig
 * @description Configures and exports the PostgreSQL connection pool.
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * @function  executeQuery
 * @summary   Executes a database query using the connection pool
 * @param     {string}  sqlText  - The SQL query template
 * @param     {Array}   params   - Parameter values for the SQL template
 * @returns   {Promise<object>}  The query result object from pg client
 * @throws    {Error} When the query execution fails
 */
async function executeQuery(sqlText, params) {
  try {
    const result = await pool.query(sqlText, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  executeQuery,
};
