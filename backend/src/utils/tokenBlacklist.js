/**
 * @file        tokenBlacklist.js
 * @module      utils/tokenBlacklist
 * @description Database-backed token blacklist for session management.
 *              Stores invalidated token JTIs (JWT ID claim) on logout.
 *              // Changed from in-memory Set to DB table: serverless functions on
 *              // Vercel do not share memory between invocations, so an in-memory
 *              // blacklist would not work — a logged-out token could still be used
 *              // on the next request if it hit a different function instance.
 * @author      Deployment Agent
 * @version     1.1.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  add
 * @summary   Adds a JTI to the database token_blacklist table
 * @param     {string} jti - Unique JWT ID claim to blacklist
 * @param     {Date} [expiresAt] - Expiry date/time of the JWT
 * @returns   {Promise<void>}
 */
async function add(jti, expiresAt) {
  if (jti) {
    const expires = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d
    const sql = `
      INSERT INTO token_blacklist (jti, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (jti) DO NOTHING;
    `;
    await executeQuery(sql, [jti, expires]);
  }
}

/**
 * @function  has
 * @summary   Checks if a JTI is present in the database token_blacklist table
 * @param     {string} jti - Unique JWT ID claim to check
 * @returns   {Promise<boolean>} True if blacklisted, false otherwise
 */
async function has(jti) {
  if (!jti) return false;
  const sql = 'SELECT EXISTS(SELECT 1 FROM token_blacklist WHERE jti = $1);';
  const res = await executeQuery(sql, [jti]);
  return res.rows[0].exists;
}

/**
 * @function  cleanup
 * @summary   Deletes expired tokens from the blacklist table to keep it small
 * @returns   {Promise<number>} Number of deleted rows
 */
async function cleanup() {
  const sql = 'DELETE FROM token_blacklist WHERE expires_at < NOW();';
  const res = await executeQuery(sql);
  return res.rowCount;
}

/**
 * @function  clear
 * @summary   Clears all records (used in testing if needed)
 * @returns   {Promise<void>}
 */
async function clear() {
  await executeQuery('DELETE FROM token_blacklist;');
}

module.exports = {
  add,
  has,
  cleanup,
  clear,
};
