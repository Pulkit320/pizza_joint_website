/**
 * @file        loyalty.test.js
 * @module      tests/api
 * @description Integration tests for the Loyalty Programme API endpoints.
 *              Run with: node tests/api/loyalty.test.js
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
  pool,
} = require('./common');

const loyaltyService = require('../../backend/src/services/loyaltyService');

async function runLoyaltyTests() {
  console.log('Running LOYALTY Module Tests...');
  try {
    await startServerIfNeeded();
    await cleanupDb();
    const { cookId, pizzaId } = await seedInitialData();

    // 1. Register and login customer to get token
    const customerEmail = 'loyalist@pizza.com';
    const regRes = await request('POST', '/auth/register', {
      firstName: 'Loyal',
      lastName: 'Customer',
      email: customerEmail,
      password: 'password123',
    });
    const customerId = regRes.body.data.id;

    const loginRes = await request('POST', '/auth/login', {
      email: customerEmail,
      password: 'password123',
    });
    const token = loginRes.body.data.token;

    // -------------------------------------------------------------
    // TEST 1: New customer account is created with 0 balance
    // -------------------------------------------------------------
    // TEST: Verify that customer registration automatically creates a loyalty account with 0 points balance
    // EXPECTS: Balance = 0, Lifetime points = 0, current tier = 'dough'
    const accountRes = await request('GET', '/loyalty/account', null, token);
    const balance = accountRes.body && accountRes.body.data && accountRes.body.data.currentBalance;
    const tier = accountRes.body && accountRes.body.data && accountRes.body.data.currentTier;
    
    assertTest(
      'New customer account is created with 0 balance',
      accountRes.status === 200 && balance === 0 && tier === 'dough',
      { status: 200, balance: 0, tier: 'dough' },
      { status: accountRes.status, balance: balance, tier: tier, response: accountRes.body }
    );

    // -------------------------------------------------------------
    // TEST 2: Completing first order awards 100 bonus points
    // -------------------------------------------------------------
    // TEST: Place and complete an order, verifying that a 100 points first-order bonus is credited in addition to base points
    // EXPECTS: Base points (1000 * 0.1 = 100) + first-order bonus (100) = 200 points total
    const orderId1 = 'b0000000-0000-0000-0000-000000000001';
    
    // Ensure birthday month is NOT current month to avoid birthday double points skewing the test
    const today = new Date();
    const differentMonth = today.getMonth() === 0 ? '02' : '01';
    await pool.query(
      `UPDATE customers SET date_of_birth = $1 WHERE id = $2`,
      [`1990-${differentMonth}-10`, customerId]
    );

    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, delivered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())`,
      [orderId1, customerId, 1000.00, 'delivered', cookId]
    );

    // Trigger order loyalty processing
    await loyaltyService.earnPointsForOrder(customerId, orderId1, 1000.00);

    const accountRes2 = await request('GET', '/loyalty/account', null, token);
    const balance2 = accountRes2.body && accountRes2.body.data && accountRes2.body.data.currentBalance;

    assertTest(
      'Completing first order awards 100 bonus points',
      accountRes2.status === 200 && balance2 === 200, // 100 base + 100 bonus
      { status: 200, balance: 200 },
      { status: accountRes2.status, balance: balance2, response: accountRes2.body }
    );

    // -------------------------------------------------------------
    // TEST 3: Completing a review awards 10 bonus points
    // -------------------------------------------------------------
    // TEST: Submit a review for the completed order, and check if points balance increases by 10
    // EXPECTS: Points balance increases from 200 to 210
    const reviewRes = await request('POST', '/reviews/order', {
      orderId: orderId1,
      overallScore: 5,
      foodQualityScore: 5,
      speedScore: 5,
      wouldOrderAgain: true,
    }, token);

    const accountRes3 = await request('GET', '/loyalty/account', null, token);
    const balance3 = accountRes3.body && accountRes3.body.data && accountRes3.body.data.currentBalance;

    assertTest(
      'Completing a review awards 10 bonus points',
      reviewRes.status === 201 && balance3 === 210, // 200 + 10
      { status: 201, balance: 210 },
      { status: reviewRes.status, balance: balance3, reviewResponse: reviewRes.body }
    );

    // -------------------------------------------------------------
    // TEST 4: Redeeming more than 50% of order subtotal is rejected
    // -------------------------------------------------------------
    // TEST: Create an order for a small amount and attempt to redeem points that exceed 50% value
    // EXPECTS: HTTP 400 response code and INVALID_REDEMPTION error code
    const orderId2 = 'b0000000-0000-0000-0000-000000000002';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, created_at)
       VALUES ($1, $2, $3, $4, now())`,
      [orderId2, customerId, 30.00, 'pending']
    );

    // Try to redeem 200 points = ₹20 discount (which is > 50% of ₹30 order subtotal)
    const redeemRes1 = await request('POST', '/loyalty/redeem', {
      orderId: orderId2,
      pointsToRedeem: 200,
    }, token);

    const codeRedeem1 = redeemRes1.body && redeemRes1.body.error && redeemRes1.body.error.code;

    assertTest(
      'Redeeming more than 50% of order subtotal is rejected',
      redeemRes1.status === 400 && codeRedeem1 === 'INVALID_REDEMPTION',
      { status: 400, code: 'INVALID_REDEMPTION' },
      { status: redeemRes1.status, code: codeRedeem1, response: redeemRes1.body }
    );

    // -------------------------------------------------------------
    // TEST 5: Redeeming with fewer than 100 points is rejected
    // -------------------------------------------------------------
    // TEST: Attempt to redeem less than the minimum redemption threshold of 100 points
    // EXPECTS: HTTP 400 response status with error code 'INVALID_REDEMPTION'
    const redeemRes2 = await request('POST', '/loyalty/redeem', {
      orderId: orderId2,
      pointsToRedeem: 50,
    }, token);

    const codeRedeem2 = redeemRes2.body && redeemRes2.body.error && redeemRes2.body.error.code;

    assertTest(
      'Redeeming with fewer than 100 points is rejected',
      redeemRes2.status === 400 && codeRedeem2 === 'INVALID_REDEMPTION',
      { status: 400, code: 'INVALID_REDEMPTION' },
      { status: redeemRes2.status, code: codeRedeem2, response: redeemRes2.body }
    );

    // -------------------------------------------------------------
    // TEST 6: Balance never goes below 0
    // -------------------------------------------------------------
    // TEST: Try to redeem points exceeding the customer's balance, and verify that adjustments never result in negative points
    // EXPECTS: Redemption fails with INSUFFICIENT_POINTS, and a separate negative admin grant is floor-capped at 0.
    const redeemRes3 = await request('POST', '/loyalty/redeem', {
      orderId: orderId2,
      pointsToRedeem: 500, // exceeds current balance (210)
    }, token);

    const codeRedeem3 = redeemRes3.body && redeemRes3.body.error && redeemRes3.body.error.code;

    // Login admin to issue negative grant
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@pizza.com',
      password: 'password123',
    });
    const adminToken = adminLogin.body.data.token;

    // Deduct 500 points via admin grant (should floor balance to 0)
    const adminGrantRes = await request('POST', '/loyalty/admin/grant', {
      customerId: customerId,
      pointsDelta: -500,
      note: 'Deducting more points than balance'
    }, adminToken);

    const balanceAfterDeduction = adminGrantRes.body && adminGrantRes.body.data && adminGrantRes.body.data.currentBalance;

    assertTest(
      'Balance never goes below 0',
      redeemRes3.status === 400 && codeRedeem3 === 'INSUFFICIENT_POINTS' && balanceAfterDeduction === 0,
      { status: 400, code: 'INSUFFICIENT_POINTS', balanceAfterDeduction: 0 },
      {
        status: redeemRes3.status,
        code: codeRedeem3,
        balanceAfterDeduction: balanceAfterDeduction,
        redeemResponse: redeemRes3.body,
        grantResponse: adminGrantRes.body
      }
    );

  } catch (error) {
    console.error('Fatal error during loyalty tests:', error);
  } finally {
    await stopServerIfNeeded();
    console.log('LOYALTY Module Tests Finished.');
  }
}

if (require.main === module) {
  runLoyaltyTests();
}

module.exports = { runLoyaltyTests };
