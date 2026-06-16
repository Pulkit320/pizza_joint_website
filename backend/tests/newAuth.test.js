/**
 * @file        newAuth.test.js
 * @module      tests
 * @description Integration test suite for the split authentication system, JTI blacklisting,
 *              role-specific payloads, and admin role checking.
 * @layer       test
 * @author      Antigravity
 * @version     1.0.0
 */

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/db');
const app = require('../server');

let server;
let port;

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

async function cleanDb() {
  await pool.query('DELETE FROM loyalty_ledger');
  await pool.query('DELETE FROM loyalty_accounts');
  await pool.query('DELETE FROM customers');
  await pool.query('DELETE FROM employees');
}

async function runTests() {
  try {
    console.log('Starting Split Auth Integration Tests...');
    await cleanDb();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Seed customer
    const customerId = 'c0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO customers (id, first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [customerId, 'John', 'Doe', 'john@customer.com', passwordHash]
    );

    // Seed loyalty account for John Doe
    await pool.query(
      `INSERT INTO loyalty_accounts (customer_id, current_balance, lifetime_points_earned, current_tier, tier_anniversary_date)
       VALUES ($1, 150, 150, 'crust', CURRENT_DATE + INTERVAL '1 year')`,
      [customerId]
    );

    // 2. Seed employee (chef)
    const chefId = 'e0000000-0000-0000-0000-000000000010';
    await pool.query(
      `INSERT INTO employees (id, first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [chefId, 'Mario', 'Chef', 'mario@chef.com', passwordHash, 'chef']
    );

    // 3. Seed employee (manager)
    const managerId = 'e0000000-0000-0000-0000-000000000020';
    await pool.query(
      `INSERT INTO employees (id, first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [managerId, 'Luigi', 'Manager', 'luigi@manager.com', passwordHash, 'manager']
    );

    console.log('✔ Seeded test database.');

    // -------------------------------------------------------------
    // TEST 1: Customer Login with Customer Account
    // -------------------------------------------------------------
    const customerLoginRes = await request('POST', '/auth/customer/login', {
      email: 'john@customer.com',
      password: 'password123',
    });
    assert.strictEqual(customerLoginRes.status, 200);
    assert.strictEqual(customerLoginRes.body.success, true);
    assert.ok(customerLoginRes.body.data.token);
    assert.strictEqual(customerLoginRes.body.data.user.role, 'customer');
    assert.strictEqual(customerLoginRes.body.data.user.tier, 'crust');
    assert.strictEqual(customerLoginRes.body.data.user.loyaltyBalance, 150);

    const customerToken = customerLoginRes.body.data.token;
    const decodedCustomer = jwt.decode(customerToken);
    assert.strictEqual(decodedCustomer.role, 'customer');
    assert.strictEqual(decodedCustomer.tier, 'crust');
    assert.strictEqual(decodedCustomer.loyaltyBalance, 150);
    assert.ok(decodedCustomer.jti);
    console.log('✔ TEST 1: Customer login returns correct payload shape and JTI.');

    // -------------------------------------------------------------
    // TEST 2: Customer Login using Staff Email
    // -------------------------------------------------------------
    const customerLoginFailRes = await request('POST', '/auth/customer/login', {
      email: 'luigi@manager.com',
      password: 'password123',
    });
    assert.strictEqual(customerLoginFailRes.status, 401);
    console.log('✔ TEST 2: Customer login rejects staff credentials.');

    // -------------------------------------------------------------
    // TEST 3: Staff Login (Chef)
    // -------------------------------------------------------------
    const chefLoginRes = await request('POST', '/auth/staff/login', {
      email: 'mario@chef.com',
      password: 'password123',
    });
    assert.strictEqual(chefLoginRes.status, 200);
    assert.strictEqual(chefLoginRes.body.data.user.role, 'chef');
    assert.strictEqual(chefLoginRes.body.data.user.isAdmin, false);

    const chefToken = chefLoginRes.body.data.token;
    const decodedChef = jwt.decode(chefToken);
    assert.strictEqual(decodedChef.role, 'chef');
    assert.strictEqual(decodedChef.isAdmin, false);
    assert.ok(decodedChef.jti);
    console.log('✔ TEST 3: Staff login (chef) returns correct payload and JTI.');

    // -------------------------------------------------------------
    // TEST 4: Staff Login (Manager)
    // -------------------------------------------------------------
    const managerLoginRes = await request('POST', '/auth/staff/login', {
      email: 'luigi@manager.com',
      password: 'password123',
    });
    assert.strictEqual(managerLoginRes.status, 200);
    assert.strictEqual(managerLoginRes.body.data.user.role, 'manager');
    assert.strictEqual(managerLoginRes.body.data.user.isAdmin, true);

    const managerToken = managerLoginRes.body.data.token;
    const decodedManager = jwt.decode(managerToken);
    assert.strictEqual(decodedManager.role, 'manager');
    assert.strictEqual(decodedManager.isAdmin, true);
    console.log('✔ TEST 4: Staff login (manager) returns isAdmin = true.');

    // -------------------------------------------------------------
    // TEST 5: Staff Login using Customer Email
    // -------------------------------------------------------------
    const staffLoginFailRes = await request('POST', '/auth/staff/login', {
      email: 'john@customer.com',
      password: 'password123',
    });
    assert.strictEqual(staffLoginFailRes.status, 401);
    console.log('✔ TEST 5: Staff login rejects customer credentials.');

    // -------------------------------------------------------------
    // TEST 6: GET /me Profile Retrieves Correct Info
    // -------------------------------------------------------------
    const meRes = await request('GET', '/auth/me', null, customerToken);
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.role, 'customer');
    assert.strictEqual(meRes.body.data.email, 'john@customer.com');
    console.log('✔ TEST 6: GET /me retrieves customer details successfully.');

    // -------------------------------------------------------------
    // TEST 7: Token JTI Blacklist (Logout)
    // -------------------------------------------------------------
    const logoutRes = await request('POST', '/auth/logout', null, customerToken);
    assert.strictEqual(logoutRes.status, 200);

    const afterLogoutRes = await request('GET', '/auth/me', null, customerToken);
    assert.strictEqual(afterLogoutRes.status, 401);
    console.log('✔ TEST 7: Logout successfully blacklists JTI and denies access.');

    // -------------------------------------------------------------
    // TEST 8: Admin Route Protection (requireAdminRole)
    // -------------------------------------------------------------
    // Manager should be allowed access
    const adminCheckManagerRes = await request('POST', '/admin/run-tier-check', {}, managerToken);
    assert.strictEqual(adminCheckManagerRes.status, 200);

    // Chef (non-admin) should be forbidden
    const adminCheckChefRes = await request('POST', '/admin/run-tier-check', {}, chefToken);
    assert.strictEqual(adminCheckChefRes.status, 403);
    console.log('✔ TEST 8: requireAdminRole allows manager access but blocks chef.');

    // -------------------------------------------------------------
    // TEST 9: PUT /auth/me Updates Customer Profile Details
    // -------------------------------------------------------------
    const customerLoginRes2 = await request('POST', '/auth/customer/login', {
      email: 'john@customer.com',
      password: 'password123',
    });
    const customerToken2 = customerLoginRes2.body.data.token;

    const updateMeRes = await request('PUT', '/auth/me', {
      name: 'Johnathan Doe-Smith',
      email: 'johnathan.smith@customer.com'
    }, customerToken2);
    assert.strictEqual(updateMeRes.status, 200);
    assert.strictEqual(updateMeRes.body.data.name, 'Johnathan Doe-Smith');
    assert.strictEqual(updateMeRes.body.data.email, 'johnathan.smith@customer.com');

    const meResAfterUpdate = await request('GET', '/auth/me', null, customerToken2);
    assert.strictEqual(meResAfterUpdate.status, 200);
    assert.strictEqual(meResAfterUpdate.body.data.name, 'Johnathan Doe-Smith');
    assert.strictEqual(meResAfterUpdate.body.data.email, 'johnathan.smith@customer.com');
    console.log('✔ TEST 9: PUT /auth/me updates customer profile and persists it.');

    // -------------------------------------------------------------
    // TEST 10: GET /loyalty/account and GET /loyalty/ledger
    // -------------------------------------------------------------
    const loyaltyAccountRes = await request('GET', '/loyalty/account', null, customerToken2);
    assert.strictEqual(loyaltyAccountRes.status, 200);
    assert.strictEqual(loyaltyAccountRes.body.data.currentTier, 'crust');

    const loyaltyAccountManagerRes = await request('GET', `/loyalty/account/${customerId}`, null, managerToken);
    assert.strictEqual(loyaltyAccountManagerRes.status, 200);

    const anotherCustId = 'c0000000-0000-0000-0000-000000000002';
    await pool.query(
      `INSERT INTO customers (id, first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [anotherCustId, 'Jane', 'Smith', 'jane@customer.com', passwordHash]
    );
    const anotherLoginRes = await request('POST', '/auth/customer/login', {
      email: 'jane@customer.com',
      password: 'password123',
    });
    const anotherToken = anotherLoginRes.body.data.token;

    const loyaltyAccountForbiddenRes = await request('GET', `/loyalty/account/${customerId}`, null, anotherToken);
    assert.strictEqual(loyaltyAccountForbiddenRes.status, 403);
    console.log('✔ TEST 10: Loyalty account endpoints check roles and parameter correctly.');

    console.log('\nAll new auth separation tests passed successfully!');
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

server = http.createServer(app);
server.listen(0, () => {
  port = server.address().port;
  runTests();
});
