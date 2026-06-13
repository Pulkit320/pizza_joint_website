/**
 * @file        reviews.test.js
 * @module      tests/api
 * @description Integration tests for the Reviews API endpoints.
 *              Run with: node tests/api/reviews.test.js
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

async function runReviewTests() {
  console.log('Running REVIEWS Module Tests...');
  try {
    await startServerIfNeeded();
    await cleanupDb();
    const { adminId, cookId, pizzaId } = await seedInitialData();

    // 1. Register and login customer to get token
    const customerEmail = 'tester@pizza.com';
    const regRes = await request('POST', '/auth/register', {
      firstName: 'Test',
      lastName: 'Reviewer',
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
    // TEST 1: Submit review for delivered order → 201 success
    // -------------------------------------------------------------
    // TEST: Create a completed ('delivered') order and submit an order review
    // EXPECTS: HTTP 201 response status indicating successful creation
    const orderId1 = 'b0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, delivered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())`,
      [orderId1, customerId, 1200.00, 'delivered', cookId]
    );

    const reviewRes1 = await request('POST', '/reviews/order', {
      orderId: orderId1,
      overallScore: 5,
      foodQualityScore: 5,
      speedScore: 5,
      writtenComment: 'Perfect delivery!',
      wouldOrderAgain: true,
    }, token);

    assertTest(
      'Submit review for delivered order → 201 success',
      reviewRes1.status === 201,
      { status: 201 },
      { status: reviewRes1.status, response: reviewRes1.body }
    );

    // -------------------------------------------------------------
    // TEST 2: Submit review for order not yet delivered
    // -------------------------------------------------------------
    // TEST: Create an order that is still 'pending' and try to submit a review
    // EXPECTS: HTTP 400 response status with error code 'ORDER_NOT_ELIGIBLE'
    const orderId2 = 'b0000000-0000-0000-0000-000000000002';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [orderId2, customerId, 800.00, 'pending', cookId]
    );

    const reviewRes2 = await request('POST', '/reviews/order', {
      orderId: orderId2,
      overallScore: 4,
      foodQualityScore: 4,
      speedScore: 4,
      wouldOrderAgain: true,
    }, token);

    const code2 = reviewRes2.body && reviewRes2.body.error && reviewRes2.body.error.code;
    assertTest(
      'Submit review for order not yet delivered → 400 with ORDER_NOT_ELIGIBLE',
      reviewRes2.status === 400 && code2 === 'ORDER_NOT_ELIGIBLE',
      { status: 400, code: 'ORDER_NOT_ELIGIBLE' },
      { status: reviewRes2.status, code: code2, response: reviewRes2.body }
    );

    // -------------------------------------------------------------
    // TEST 3: Submit second review for same order
    // -------------------------------------------------------------
    // TEST: Try to submit another review on the order that was already reviewed in TEST 1
    // EXPECTS: HTTP 409 response status with error code 'REVIEW_ALREADY_EXISTS'
    const reviewRes3 = await request('POST', '/reviews/order', {
      orderId: orderId1,
      overallScore: 2,
      foodQualityScore: 2,
      speedScore: 2,
      wouldOrderAgain: false,
    }, token);

    const code3 = reviewRes3.body && reviewRes3.body.error && reviewRes3.body.error.code;
    assertTest(
      'Submit second review for same order → 409 with REVIEW_ALREADY_EXISTS',
      reviewRes3.status === 409 && code3 === 'REVIEW_ALREADY_EXISTS',
      { status: 409, code: 'REVIEW_ALREADY_EXISTS' },
      { status: reviewRes3.status, code: code3, response: reviewRes3.body }
    );

    // -------------------------------------------------------------
    // TEST 4: Submit employee rating without employee link
    // -------------------------------------------------------------
    // TEST: Submit a rating for an employee who is not assigned to the order
    // EXPECTS: HTTP 400 response status with error code 'EMPLOYEE_NOT_ON_ORDER'
    const unlinkedEmployeeId = adminId; // Admin was not the cook/server for orderId1
    const reviewRes4 = await request('POST', '/reviews/employee', {
      employeeId: unlinkedEmployeeId,
      orderId: orderId1,
      serviceScore: 5,
      tags: ['polite'],
    }, token);

    const code4 = reviewRes4.body && reviewRes4.body.error && reviewRes4.body.error.code;
    assertTest(
      'Submit employee rating without employee link → 400 with EMPLOYEE_NOT_ON_ORDER',
      reviewRes4.status === 400 && code4 === 'EMPLOYEE_NOT_ON_ORDER',
      { status: 400, code: 'EMPLOYEE_NOT_ON_ORDER' },
      { status: reviewRes4.status, code: code4, response: reviewRes4.body }
    );

    // -------------------------------------------------------------
    // TEST 5: Submit review more than 7 days after delivery
    // -------------------------------------------------------------
    // TEST: Create an order delivered 10 days ago and attempt to submit a review
    // EXPECTS: HTTP 400 response status with error code 'REVIEW_WINDOW_EXPIRED'
    const orderId3 = 'b0000000-0000-0000-0000-000000000003';
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, delivered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)`,
      [orderId3, customerId, 1500.00, 'delivered', cookId, tenDaysAgo.toISOString()]
    );

    const reviewRes5 = await request('POST', '/reviews/order', {
      orderId: orderId3,
      overallScore: 3,
      foodQualityScore: 3,
      speedScore: 3,
      wouldOrderAgain: true,
    }, token);

    const code5 = reviewRes5.body && reviewRes5.body.error && reviewRes5.body.error.code;
    assertTest(
      'Submit review more than 7 days after delivery → 400 with REVIEW_WINDOW_EXPIRED',
      reviewRes5.status === 400 && code5 === 'REVIEW_WINDOW_EXPIRED',
      { status: 400, code: 'REVIEW_WINDOW_EXPIRED' },
      { status: reviewRes5.status, code: code5, response: reviewRes5.body }
    );

  } catch (error) {
    console.error('Fatal error during reviews tests:', error);
  } finally {
    await stopServerIfNeeded();
    console.log('REVIEWS Module Tests Finished.');
  }
}

if (require.main === module) {
  runReviewTests();
}

module.exports = { runReviewTests };
