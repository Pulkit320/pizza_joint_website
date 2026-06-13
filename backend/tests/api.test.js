/**
 * @file        api.test.js
 * @module      ApiTests
 * @description Comprehensive integration and transaction-level tests for the Pizza Joint API.
 * @layer       test
 * @author      Antigravity
 * @version     1.0.0
 */

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const app = require('../server');

let server;
let port;
let baseUrl;

/**
 * @function  request
 * @summary   Utility helper to perform HTTP requests to the local test server
 * @param     {string}  method  - HTTP verb (GET, POST, etc.)
 * @param     {string}  path    - URL path relative to /api/v1
 * @param     {object}  [body]  - Request JSON body
 * @param     {string}  [token] - Optional Bearer JWT token
 * @returns   {Promise<object>} Response status and parsed body
 */
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * @function  cleanDb
 * @summary   Cleans database tables before and after test execution to avoid test pollution
 * @returns   {Promise<void>}
 */
async function cleanDb() {
  console.log('Cleaning test database tables...');
  await pool.query('DELETE FROM eotw_selections');
  await pool.query('DELETE FROM employee_ratings');
  await pool.query('DELETE FROM order_item_ratings');
  await pool.query('DELETE FROM order_reviews');
  await pool.query('DELETE FROM referrals');
  await pool.query('DELETE FROM loyalty_ledger');
  await pool.query('DELETE FROM loyalty_accounts');
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM deliveries');
  await pool.query('DELETE FROM products');
  await pool.query('DELETE FROM customers');
  await pool.query('DELETE FROM shifts');
  await pool.query('DELETE FROM employees');
}

/**
 * @function  runTests
 * @summary   Orchestrates and executes all API and database integration tests
 * @returns   {Promise<void>}
 */
async function runTests() {
  try {
    await cleanDb();

    console.log('Seeding employees and products...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Seed employees
    const adminId = 'a0000000-0000-0000-0000-000000000001';
    const cookId = 'e0000000-0000-0000-0000-000000000002';
    
    await pool.query(
      `INSERT INTO employees (id, first_name, last_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [
        adminId, 'Admin', 'User', 'admin@pizza.com', passwordHash, 'admin',
        cookId, 'Cook', 'Helper', 'cook@pizza.com', passwordHash, 'cook'
      ]
    );

    // 2. Seed product
    const pizzaId = 'f0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO products (id, name, price) VALUES ($1, $2, $3)`,
      [pizzaId, 'Margherita Pizza', 400.00]
    );

    console.log('\n--- 1. Auth Module Tests ---');
    
    // Test Customer Registration
    const regRes = await request('POST', '/auth/register', {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@gmail.com',
      password: 'password123',
      dateOfBirth: '1995-06-15', // Birth month June (matches month of test)
    });
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.success, true);
    const aliceId = regRes.body.data.id;
    console.log('✔ Alice registered successfully.');

    // Test Loyalty Account Automatic Creation
    const accountCheck = await pool.query('SELECT * FROM loyalty_accounts WHERE customer_id = $1', [aliceId]);
    assert.strictEqual(accountCheck.rows.length, 1);
    assert.strictEqual(accountCheck.rows[0].current_tier, 'dough');
    assert.strictEqual(accountCheck.rows[0].current_balance, 0);
    console.log('✔ Loyalty account automatically created for Alice.');

    // Test Referral Registration
    const regRes2 = await request('POST', '/auth/register', {
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob@gmail.com',
      password: 'password123',
      referredBy: aliceId,
    });
    assert.strictEqual(regRes2.status, 201);
    const bobId = regRes2.body.data.id;
    console.log('✔ Bob registered, referred by Alice.');

    // Verify referral record is written in referrals table
    const referralCheck = await pool.query('SELECT * FROM referrals WHERE referred_customer_id = $1', [bobId]);
    assert.strictEqual(referralCheck.rows.length, 1);
    assert.strictEqual(referralCheck.rows[0].referrer_customer_id, aliceId);
    assert.strictEqual(referralCheck.rows[0].referral_bonus_paid, false);
    console.log('✔ Referral relation logged successfully.');

    // Test Customer Login
    const loginRes = await request('POST', '/auth/login', {
      email: 'alice@gmail.com',
      password: 'password123',
    });
    assert.strictEqual(loginRes.status, 200);
    const aliceToken = loginRes.body.data.token;
    assert.strictEqual(loginRes.body.data.user.role, 'customer');
    console.log('✔ Customer login successful.');

    // Test Admin Login
    const adminLoginRes = await request('POST', '/auth/login', {
      email: 'admin@pizza.com',
      password: 'password123',
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.body.data.token;
    assert.strictEqual(adminLoginRes.body.data.user.role, 'admin');
    console.log('✔ Admin login successful.');

    // Test GET /me
    const meRes = await request('GET', '/auth/me', null, aliceToken);
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.email, 'alice@gmail.com');
    console.log('✔ GET /auth/me profile retrieve matches.');

    // Test JWT Blacklisting (Logout)
    const logoutRes = await request('POST', '/auth/logout', null, aliceToken);
    assert.strictEqual(logoutRes.status, 200);
    console.log('✔ Logout request processed.');

    const expiredTokenCheck = await request('GET', '/auth/me', null, aliceToken);
    assert.strictEqual(expiredTokenCheck.status, 401);
    console.log('✔ Request rejected with logged-out token.');

    // Login Alice back to get a fresh token
    const freshLogin = await request('POST', '/auth/login', {
      email: 'alice@gmail.com',
      password: 'password123',
    });
    const aliceTokenFresh = freshLogin.body.data.token;

    console.log('\n--- 2. Loyalty Points & Order Earnings Tests ---');

    // Create an order for Alice to complete
    const orderId = 'b0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, aliceId, 1000.00, 'pending', cookId]
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, quantity) 
       VALUES (gen_random_uuid(), $1, $2, 2)`,
      [orderId, pizzaId]
    );

    // Complete the order
    const today = new Date();
    await pool.query(
      `UPDATE orders 
       SET status = 'delivered', delivered_at = $1 
       WHERE id = $2`,
      [today.toISOString(), orderId]
    );

    // Earn points for order: Amount ₹1000. 
    // Base rate: 0.1 pts/rupee = 100 pts.
    // Tier multiplier: dough (1x) = 100 pts.
    // Birthday bonus: since her DOB month is June, the test runner checks if birth month matches current month.
    // To make sure birthday multiplier works regardless of test execution date, let's update Alice's birth month to today's month!
    const currentMonthStr = today.toISOString().split('-')[1]; // '06'
    await pool.query(
      `UPDATE customers SET date_of_birth = $1 WHERE id = $2`,
      [`1995-${currentMonthStr}-15`, aliceId]
    );

    // Call earnPointsForOrder directly
    const loyaltyService = require('../src/services/loyaltyService');
    await loyaltyService.earnPointsForOrder(aliceId, orderId, 1000.00);

    // Let's verify Alice's points balance:
    // 1. Order earn: 100 points
    // 2. Birthday multiplier earn: 100 points
    // 3. First order bonus: 100 points
    // Total should be 300 points!
    const aliceAccount = await loyaltyService.getCustomerLoyalty(aliceId);
    assert.strictEqual(aliceAccount.currentBalance, 300);
    assert.strictEqual(aliceAccount.lifetimePointsEarned, 300);
    console.log('✔ Alice points calculated correctly (Order + Birthday + First Order Bonus = 300 pts).');

    // Process first order for Bob to check referral bonus triggers for Alice
    const orderId2 = 'b0000000-0000-0000-0000-000000000002';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId2, bobId, 500.00, 'pending', cookId]
    );
    await pool.query(
      `UPDATE orders SET status = 'collected', collected_at = $1 WHERE id = $2`,
      [today.toISOString(), orderId2]
    );

    // Make sure Bob's birthday is NOT this month to avoid extra calculations
    const differentMonth = today.getMonth() === 0 ? '02' : '01';
    await pool.query(
      `UPDATE customers SET date_of_birth = $1 WHERE id = $2`,
      [`1990-${differentMonth}-10`, bobId]
    );

    await loyaltyService.earnPointsForOrder(bobId, orderId2, 500.00);

    // Verify Bob has: Order earn (50 pts) + First order bonus (100 pts) = 150 pts
    const bobAccount = await loyaltyService.getCustomerLoyalty(bobId);
    assert.strictEqual(bobAccount.currentBalance, 150);

    // Verify Alice was awarded referral bonus: 300 + 200 = 500 points!
    const aliceAccountAfterRef = await loyaltyService.getCustomerLoyalty(aliceId);
    assert.strictEqual(aliceAccountAfterRef.currentBalance, 500);
    console.log('✔ Referral bonus of 200 points credited to referrer Alice.');

    // Verify referral status is paid
    const refRecord = await pool.query('SELECT * FROM referrals WHERE referred_customer_id = $1', [bobId]);
    assert.strictEqual(refRecord.rows[0].referral_bonus_paid, true);
    assert.strictEqual(refRecord.rows[0].bonus_order_id, orderId2);
    console.log('✔ Referral bonus marked as paid in ledger.');

    console.log('\n--- 3. Point Redemption Tests ---');

    // Create another order for Alice: ₹1000. We will redeem 200 points for a ₹20 discount
    const orderId3 = 'b0000000-0000-0000-0000-000000000003';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4)`,
      [orderId3, aliceId, 1000.00, 'pending']
    );

    // Alice redeems 200 points
    const redeemRes = await request('POST', '/loyalty/redeem', {
      orderId: orderId3,
      pointsToRedeem: 200,
    }, aliceTokenFresh);

    assert.strictEqual(redeemRes.status, 200);
    assert.strictEqual(redeemRes.body.data.currentBalance, 300); // 500 - 200 = 300
    
    // Check order total is discounted: ₹1000 - ₹20 = ₹980
    const orderCheck = await pool.query('SELECT total_amount FROM orders WHERE id = $1', [orderId3]);
    assert.strictEqual(parseFloat(orderCheck.rows[0].total_amount), 980.00);
    console.log('✔ Points redemption applied ₹20 discount (₹980 total).');

    // Test redemption limits: cannot exceed 50%
    // Seed Alice with 2000 points and create a small ₹100 order
    await pool.query('UPDATE loyalty_accounts SET current_balance = 2000 WHERE customer_id = $1', [aliceId]);
    const orderIdLimit = 'b0000000-0000-0000-0000-000000000099';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4)`,
      [orderIdLimit, aliceId, 100.00, 'pending']
    );

    const badRedeem = await request('POST', '/loyalty/redeem', {
      orderId: orderIdLimit,
      pointsToRedeem: 1000, // ₹100 discount, which is 100% of the ₹100 order (exceeds 50% limit)
    }, aliceTokenFresh);
    assert.strictEqual(badRedeem.status, 400);
    assert.strictEqual(badRedeem.body.error.code, 'INVALID_REDEMPTION');
    console.log('✔ Point redemption exceeding 50% limit correctly rejected.');

    // Reset Alice's points balance back to 300 to align with subsequent review tests
    await pool.query('UPDATE loyalty_accounts SET current_balance = 300 WHERE customer_id = $1', [aliceId]);

    console.log('\n--- 4. Order Reviews & Employee Ratings Tests ---');

    // Submit review for completed order 1
    const reviewRes = await request('POST', '/reviews/order', {
      orderId: orderId,
      overallScore: 5,
      foodQualityScore: 5,
      speedScore: 4,
      writtenComment: 'Delicious pizza, fast delivery!',
      wouldOrderAgain: true,
      itemRatings: [
        {
          orderItemId: (await pool.query('SELECT id FROM order_items WHERE order_id = $1', [orderId])).rows[0].id,
          productId: pizzaId,
          itemScore: 5,
        }
      ]
    }, aliceTokenFresh);
    assert.strictEqual(reviewRes.status, 201);
    console.log('✔ Order review saved, credited 10 loyalty points.');

    // Check Alice has: 300 + 10 = 310 points
    const aliceAccountReview = await loyaltyService.getCustomerLoyalty(aliceId);
    assert.strictEqual(aliceAccountReview.currentBalance, 310);

    // Try submitting duplicate review
    const dupReviewRes = await request('POST', '/reviews/order', {
      orderId: orderId,
      overallScore: 3,
      foodQualityScore: 3,
      speedScore: 3,
      wouldOrderAgain: true,
    }, aliceTokenFresh);
    assert.strictEqual(dupReviewRes.status, 409);
    console.log('✔ Duplicate review submissions rejected.');

    // Submit employee rating: Rate cookId for orderId
    const rateRes = await request('POST', '/reviews/employee', {
      employeeId: cookId,
      orderId: orderId,
      serviceScore: 5,
      writtenNote: 'Excellent service by the chef!',
      tags: ['professional', 'friendly'],
    }, aliceTokenFresh);
    assert.strictEqual(rateRes.status, 201);
    const ratingId = rateRes.body.data.id;
    console.log('✔ Employee rating submitted, credited 5 loyalty points.');

    // Alice should have: 310 + 5 = 315 points
    const aliceAccountRating = await loyaltyService.getCustomerLoyalty(aliceId);
    assert.strictEqual(aliceAccountRating.currentBalance, 315);

    // Admin excludes employee rating
    const excludeRes = await request('POST', `/reviews/employee/rating/${ratingId}/exclude`, {
      reason: 'Contains spam content',
    }, adminToken);
    assert.strictEqual(excludeRes.status, 200);
    assert.strictEqual(excludeRes.body.data.is_excluded, true);
    console.log('✔ Employee rating successfully excluded by admin.');

    console.log('\n--- 5. Employee of the Week Tests ---');

    // Seed shift for cookId in evaluated week
    // We will evaluate the prior calendar week
    const refDate = new Date();
    const dayOfWeek = refDate.getDay();
    const diffToPrevMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6;
    const prevMonday = new Date(refDate);
    prevMonday.setDate(refDate.getDate() - diffToPrevMonday);
    
    const weekStartStr = prevMonday.toISOString().split('T')[0];

    // Seed shifts
    await pool.query(
      `INSERT INTO shifts (employee_id, shift_date, start_time, end_time, is_late) 
       VALUES ($1, $2, '09:00:00', '17:00:00', false)`,
      [cookId, weekStartStr]
    );

    // Make sure cook has positive employee rating for this week (unexclude the existing one and backdate it)
    await pool.query(
      `UPDATE employee_ratings 
       SET created_at = $1, is_excluded = false 
       WHERE employee_id = $2 AND order_id = $3`,
      [prevMonday.toISOString(), cookId, orderId]
    );

    // Ensure orders are in the target week
    await pool.query(`UPDATE orders SET created_at = $1 WHERE id = $2`, [prevMonday.toISOString(), orderId]);

    // Calculate EOTW
    const eotwCalcRes = await request('POST', '/admin/run-eotw-calculation', {}, adminToken);
    assert.strictEqual(eotwCalcRes.status, 200);
    assert.strictEqual(eotwCalcRes.body.data.employeeId, cookId);
    console.log(`✔ EOTW successfully calculated. Winner: ${eotwCalcRes.body.data.firstName} with score: ${eotwCalcRes.body.data.score}`);

    // Since the cook's email is cook@pizza.com, and we don't have a customer profile with this email, points shouldn't be credited.
    assert.strictEqual(eotwCalcRes.body.data.pointsCreditedToCustomer, false);

    // Seed a customer profile for the cook to test the 500 bonus points reward
    await request('POST', '/auth/register', {
      firstName: 'Cook',
      lastName: 'Helper',
      email: 'cook_customer@pizza.com',
      password: 'password123',
    });
    // Link employee email to customer email to trigger points matching
    await pool.query("UPDATE employees SET email = 'cook_customer@pizza.com' WHERE id = $1", [cookId]);

    // Run calculation again (overwriting the week_start)
    const eotwCalcRes2 = await request('POST', '/admin/run-eotw-calculation', {}, adminToken);
    assert.strictEqual(eotwCalcRes2.status, 200);
    assert.strictEqual(eotwCalcRes2.body.data.pointsCreditedToCustomer, true);
    console.log('✔ EOTW 500 bonus points successfully credited to winner customer profile.');

    // Public Endpoint check
    const publicEotw = await request('GET', '/employees/employee-of-week');
    assert.strictEqual(publicEotw.status, 200);
    assert.strictEqual(publicEotw.body.data.email, 'cook_customer@pizza.com');
    console.log('✔ Public GET /employees/employee-of-week returns winner info.');

    console.log('\n--- 6. Loyalty Anniversaries and Expiration Check Tests ---');

    // Test run tier anniversary and expirations checks
    const runChecks = await request('POST', '/admin/run-tier-check', {}, adminToken);
    assert.strictEqual(runChecks.status, 200);
    assert.strictEqual(runChecks.body.data.success, true);
    console.log('✔ Loyalty sweep checks executed successfully.');

    console.log('\nAll integration tests passed successfully!');
    await cleanDb();
    server.close(() => {
      console.log('Test server closed.');
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    await cleanDb();
    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

// Start local HTTP server on random port and run the test suite
server = http.createServer(app);
server.listen(0, () => {
  port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
  runTests();
});

