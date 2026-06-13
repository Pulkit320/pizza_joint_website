/**
 * @file        auth.test.js
 * @module      tests/api
 * @description Integration tests for the Auth API endpoints.
 *              Run with: node tests/api/auth.test.js
 * @author      QA Agent
 * @version     1.0.0
 */

const {
  startServerIfNeeded,
  stopServerIfNeeded,
  cleanupDb,
  seedInitialData,
  request,
  assertTest,
} = require('./common');

async function runAuthTests() {
  console.log('Running AUTH Module Tests...');
  try {
    await startServerIfNeeded();
    await cleanupDb();
    const { adminId } = await seedInitialData();

    // -------------------------------------------------------------
    // TEST 1: Register with valid data
    // -------------------------------------------------------------
    // TEST: Register with valid data and verify that 201 status is returned and JWT is present in response
    // EXPECTS: HTTP 201 response status, success flag, and a JWT token string
    const regPayload = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@gmail.com',
      password: 'password123',
      dateOfBirth: '1995-06-15',
    };
    
    const regRes = await request('POST', '/auth/register', regPayload);
    const hasToken = regRes.body && regRes.body.data && typeof regRes.body.data.token === 'string';
    assertTest(
      'Register with valid data → 201 and JWT returned',
      regRes.status === 201 && hasToken === true,
      { status: 201, hasToken: true },
      { status: regRes.status, hasToken: hasToken, response: regRes.body }
    );

    // -------------------------------------------------------------
    // TEST 2: Register with duplicate email
    // -------------------------------------------------------------
    // TEST: Attempt to register a customer using an email address that is already registered
    // EXPECTS: HTTP 400 response status with error code 'DUPLICATE_EMAIL'
    const dupRes = await request('POST', '/auth/register', {
      firstName: 'Double',
      lastName: 'Trouble',
      email: 'alice@gmail.com',
      password: 'password123',
    });
    const dupCode = dupRes.body && dupRes.body.error && dupRes.body.error.code;
    assertTest(
      'Register with duplicate email → 400 with DUPLICATE_EMAIL',
      dupRes.status === 400 && dupCode === 'DUPLICATE_EMAIL',
      { status: 400, code: 'DUPLICATE_EMAIL' },
      { status: dupRes.status, code: dupCode, response: dupRes.body }
    );

    // -------------------------------------------------------------
    // TEST 3: Login with wrong password
    // -------------------------------------------------------------
    // TEST: Attempt login for registered email but with incorrect password credentials
    // EXPECTS: HTTP 401 response status with error code 'INVALID_CREDENTIALS'
    const loginRes = await request('POST', '/auth/login', {
      email: 'alice@gmail.com',
      password: 'wrong_password_xyz',
    });
    const loginCode = loginRes.body && loginRes.body.error && loginRes.body.error.code;
    assertTest(
      'Login with wrong password → 401 with INVALID_CREDENTIALS',
      loginRes.status === 401 && loginCode === 'INVALID_CREDENTIALS',
      { status: 401, code: 'INVALID_CREDENTIALS' },
      { status: loginRes.status, code: loginCode, response: loginRes.body }
    );

    // -------------------------------------------------------------
    // TEST 4: Access protected route without token
    // -------------------------------------------------------------
    // TEST: Query profile /me API route without supplying any Authorization headers
    // EXPECTS: HTTP 401 response status
    const protectRes = await request('GET', '/auth/me');
    assertTest(
      'Access protected route without token → 401',
      protectRes.status === 401,
      { status: 401 },
      { status: protectRes.status, response: protectRes.body }
    );

    // -------------------------------------------------------------
    // TEST 5: Access admin route as customer
    // -------------------------------------------------------------
    // TEST: Login as customer, obtain token, and attempt to query an admin endpoint
    // EXPECTS: HTTP 403 response status
    const actualLoginRes = await request('POST', '/auth/login', {
      email: 'alice@gmail.com',
      password: 'password123',
    });
    
    if (actualLoginRes.status === 200 && actualLoginRes.body && actualLoginRes.body.data) {
      const aliceToken = actualLoginRes.body.data.token;
      // Fetch admin loyalty overview page
      const adminRes = await request('GET', '/loyalty/admin/overview', null, aliceToken);
      assertTest(
        'Access admin route as customer → 403',
        adminRes.status === 403,
        { status: 403 },
        { status: adminRes.status, response: adminRes.body }
      );
    } else {
      console.log('FAIL: Access admin route as customer → 403 (Skipped due to login failure)');
    }

  } catch (error) {
    console.error('Fatal error during auth tests:', error);
  } finally {
    await stopServerIfNeeded();
    console.log('AUTH Module Tests Finished.');
  }
}

if (require.main === module) {
  runAuthTests();
}

module.exports = { runAuthTests };
