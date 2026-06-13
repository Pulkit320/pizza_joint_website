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

// LOCAL DEV: uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
// PRODUCTION (Vercel): uses DATABASE_URL (set in Vercel dashboard,
// points to a hosted Postgres instance — Neon/Supabase/Railway)
let poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  
  // CHANGED FOR VERCEL: Enable SSL connection if the connection URL requests it or in production
  if (process.env.DATABASE_URL.includes('sslmode=require') || 
      process.env.DATABASE_URL.includes('ssl=true') || 
      process.env.NODE_ENV === 'production') {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
  }
} else {
  poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
}

const pool = new Pool(poolConfig);

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
