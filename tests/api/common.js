/**
 * @file        common.js
 * @module      tests/api
 * @description Common helpers and utilities for integration testing.
 *              Contains database cleanups, initial seeding, local server setup, and assertion loggers.
 * @author      QA Agent
 * @version     1.0.0
 */

const http = require('http');
const { pool } = require('../../backend/src/config/db');
const app = require('../../backend/server');

let serverInstance = null;

/**
 * @function  startServerIfNeeded
 * @summary   Pings port 3000 to see if server is active. If not, boots local Express instance.
 * @returns   {Promise<void>}
 */
async function startServerIfNeeded() {
  try {
    const res = await fetch('http://localhost:3000/health');
    if (res.ok) {
      // Already running
      return;
    }
  } catch (err) {
    // Not running, we will boot it
  }

  serverInstance = http.createServer(app);
  await new Promise((resolve, reject) => {
    serverInstance.listen(3000, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * @function  stopServerIfNeeded
 * @summary   Shuts down the dynamically started test server.
 * @returns   {Promise<void>}
 */
async function stopServerIfNeeded() {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
  }
}

/**
 * @function  cleanupDb
 * @summary   Cleans database tables using CASCADE truncate to clear state between tests.
 * @returns   {Promise<void>}
 */
async function cleanupDb() {
  await pool.query(
    'TRUNCATE eotw_selections, employee_ratings, order_item_ratings, order_reviews, referrals, loyalty_ledger, loyalty_accounts, order_items, orders, deliveries, products, customers, shifts, employees CASCADE'
  );
}

/**
 * @function  seedInitialData
 * @summary   Seeds basic product and employee data necessary for integration checks.
 * @returns   {Promise<object>} Seeded entity IDs
 */
async function seedInitialData() {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const adminId = 'a0000000-0000-0000-0000-000000000001';
  const cookId = 'e0000000-0000-0000-0000-000000000002';
  const pizzaId = 'f0000000-0000-0000-0000-000000000001';

  await pool.query(
    `INSERT INTO employees (id, first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING`,
    [adminId, 'Admin', 'User', 'admin@pizza.com', passwordHash, 'admin']
  );

  await pool.query(
    `INSERT INTO employees (id, first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING`,
    [cookId, 'Cook', 'Helper', 'cook@pizza.com', passwordHash, 'cook']
  );

  await pool.query(
    `INSERT INTO products (id, name, price)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [pizzaId, 'Margherita Pizza', 400.00]
  );

  return { adminId, cookId, pizzaId };
}

/**
 * @function  request
 * @summary   Helper to call API endpoints using global fetch
 * @param     {string}  method  - HTTP Verb (GET, POST, etc.)
 * @param     {string}  path    - Endpoint path relative to /api/v1
 * @param     {object}  [body]  - JSON payload
 * @param     {string}  [token] - Auth Bearer Token
 * @returns   {Promise<object>} Status, headers, and response body
 */
async function request(method, path, body = null, token = null) {
  const url = `http://localhost:3000/api/v1${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    let parsedBody = null;
    const text = await res.text();
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }
    return {
      status: res.status,
      body: parsedBody,
    };
  } catch (error) {
    console.error(`Request failed to ${url}:`, error.message);
    throw error;
  }
}

/**
 * @function  assertTest
 * @summary   Logs PASS/FAIL depending on condition check, showing expected vs actual output
 * @param     {string}  testName  - Name/description of test case
 * @param     {boolean} condition - Boolean check outcome
 * @param     {*}       expected  - Expected value
 * @param     {*}       actual    - Actual value
 * @returns   {boolean} Outcome of assertion
 */
function assertTest(testName, condition, expected, actual) {
  if (condition) {
    console.log(`PASS: ${testName}`);
    return true;
  } else {
    console.log(`FAIL: ${testName}`);
    console.log(`      Expected: ${JSON.stringify(expected)}`);
    console.log(`      Actual:   ${JSON.stringify(actual)}`);
    return false;
  }
}

module.exports = {
  startServerIfNeeded,
  stopServerIfNeeded,
  cleanupDb,
  seedInitialData,
  request,
  assertTest,
  pool,
};
