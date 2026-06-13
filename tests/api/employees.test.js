/**
 * @file        employees.test.js
 * @module      tests/api
 * @description Integration tests for the Employees API endpoints and Employee of the Week algorithms.
 *              Run with: node tests/api/employees.test.js
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

async function runEmployeeTests() {
  console.log('Running EMPLOYEES Module Tests...');
  try {
    await startServerIfNeeded();
    await cleanupDb();
    const { adminId, cookId } = await seedInitialData();

    // Register a customer to place orders and submit ratings
    const customerEmail = 'customer@pizza.com';
    const regRes = await request('POST', '/auth/register', {
      firstName: 'Customer',
      lastName: 'User',
      email: customerEmail,
      password: 'password123',
    });
    const customerId = regRes.body.data.id;

    // Login admin to execute calculations
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@pizza.com',
      password: 'password123',
    });
    const adminToken = adminLogin.body.data.token;

    // Determine the prior calendar week Monday and Sunday dates
    const referenceDate = new Date();
    const day = referenceDate.getDay();
    const diffToPrevMonday = day === 0 ? 13 : day + 6;
    const prevMonday = new Date(referenceDate);
    prevMonday.setDate(referenceDate.getDate() - diffToPrevMonday);
    prevMonday.setHours(12, 0, 0, 0); // avoid TZ boundaries

    const weekStartStr = prevMonday.toISOString().split('T')[0];
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);
    const weekEndStr = prevSunday.toISOString().split('T')[0];

    // -------------------------------------------------------------
    // TEST 1: Calculation runs without error when there is eligible data
    // -------------------------------------------------------------
    // TEST: Seed one shift, one completed order, and one employee rating, then run EOTW calculation
    // EXPECTS: HTTP 200 response with the calculated winner details
    await pool.query(
      `INSERT INTO shifts (employee_id, shift_date, start_time, end_time, is_late)
       VALUES ($1, $2, '09:00:00', '17:00:00', false)`,
      [cookId, weekStartStr]
    );

    const orderId1 = 'b0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId1, customerId, 500.00, 'delivered', cookId, prevMonday.toISOString()]
    );

    await pool.query(
      `INSERT INTO employee_ratings (employee_id, order_id, customer_id, service_score, is_excluded, created_at)
       VALUES ($1, $2, $3, 5, false, $4)`,
      [cookId, orderId1, customerId, prevMonday.toISOString()]
    );

    const eotwRes1 = await request('POST', '/admin/run-eotw-calculation', {
      customDate: referenceDate.toISOString().split('T')[0]
    }, adminToken);

    assertTest(
      'Calculation runs without error when there is eligible data',
      eotwRes1.status === 200 && eotwRes1.body && eotwRes1.body.success === true,
      { status: 200, success: true },
      { status: eotwRes1.status, response: eotwRes1.body }
    );

    // -------------------------------------------------------------
    // TEST 2: Employee with fewer than 10 ratings uses store average, not 0
    // -------------------------------------------------------------
    // TEST: Create an employee (Cook) with fewer than 10 ratings (e.g. 1 rating of 5.0)
    //       and a second employee (Server) with 12 ratings (e.g. all 3.0).
    //       Verify if the calculation uses the store average rating for Cook, who has fewer than 10 ratings.
    // EXPECTS: Cook (with fewer than 10 ratings) should use the store average rating of ~3.15, not their own 5.0 rating.
    
    // We clean up DB and seed specifically for this test case
    await cleanupDb();
    const { adminId: adminId2, cookId: cookId2 } = await seedInitialData();

    // Re-register customer since DB was truncated
    const regRes2 = await request('POST', '/auth/register', {
      firstName: 'Customer',
      lastName: 'User2',
      email: customerEmail,
      password: 'password123',
    });
    const customerId2 = regRes2.body.data.id;

    // Re-login admin since employees table was truncated and re-seeded
    const adminLogin2 = await request('POST', '/auth/login', {
      email: 'admin@pizza.com',
      password: 'password123',
    });
    const adminToken2 = adminLogin2.body.data.token;

    // Setup: Cook (cookId2) will have 3 ratings of 5.0 (fewer than 10).
    //        Admin (adminId2) will have 12 ratings of 3.0 (more than 10).
    // Total ratings: 15. Store average = (3 * 5.0 + 12 * 3.0) / 15 = 3.4
    // If the rule is applied, Cook's average service rating used in EOTW should be the store average (3.4), not their own 5.0.

    // Seed shifts for both employees in evaluated week
    await pool.query(
      `INSERT INTO shifts (employee_id, shift_date, start_time, end_time, is_late)
       VALUES ($1, $2, '09:00:00', '17:00:00', false), ($3, $2, '09:00:00', '17:00:00', false)`,
      [cookId2, weekStartStr, adminId2]
    );

    // Seed ratings for Cook: 3 ratings of 5.0
    for (let i = 1; i <= 3; i++) {
      const oId = `c0000000-0000-0000-0000-00000000000${i}`;
      await pool.query(
        `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, created_at)
         VALUES ($1, $2, 100.00, 'delivered', $3, $4)`,
        [oId, customerId2, cookId2, prevMonday.toISOString()]
      );
      await pool.query(
        `INSERT INTO employee_ratings (id, employee_id, order_id, customer_id, service_score, is_excluded, created_at)
         VALUES ($1, $2, $3, $4, 5, false, $5)`,
        [`d0000000-0000-0000-0000-00000000000${i}`, cookId2, oId, customerId2, prevMonday.toISOString()]
      );
    }

    // Seed ratings for Admin: 12 ratings of 3.0
    for (let i = 1; i <= 12; i++) {
      const oId = `c0000000-0000-0000-0000-0000000000${10 + i}`;
      await pool.query(
        `INSERT INTO orders (id, customer_id, total_amount, status, server_employee_id, created_at)
         VALUES ($1, $2, 100.00, 'delivered', $3, $4)`,
        [oId, customerId2, adminId2, prevMonday.toISOString()]
      );
      await pool.query(
        `INSERT INTO employee_ratings (id, employee_id, order_id, customer_id, service_score, is_excluded, created_at)
         VALUES ($1, $2, $3, $4, 3, false, $5)`,
        [`d0000000-0000-0000-0000-0000000000${10 + i}`, adminId2, oId, customerId2, prevMonday.toISOString()]
      );
    }

    // Run EOTW calculation. Cook has perfect punctuality and 5.0 (fewer than 10 ratings) or store average (3.4).
    // Let's run it.
    const eotwRes2 = await request('POST', '/admin/run-eotw-calculation', {
      customDate: referenceDate.toISOString().split('T')[0]
    }, adminToken2);

    // Let's retrieve what was written in the EOTW selection table for cookId
    const eotwRecord = (await pool.query(
      `SELECT * FROM eotw_selections WHERE employee_id = $1 ORDER BY week_start DESC LIMIT 1`,
      [cookId2]
    )).rows[0];

    const avgRatingUsed = eotwRecord ? parseFloat(eotwRecord.avg_service_rating) : null;

    assertTest(
      'Employee with fewer than 10 ratings uses store average, not 0 (or own average)',
      avgRatingUsed === 3.4,
      { avgServiceRatingUsed: 3.4 },
      { avgServiceRatingUsed: avgRatingUsed, fullEotwRecord: eotwRecord, response: eotwRes2.body }
    );

  } catch (error) {
    console.error('Fatal error during employee tests:', error);
  } finally {
    await stopServerIfNeeded();
    console.log('EMPLOYEES Module Tests Finished.');
  }
}

if (require.main === module) {
  runEmployeeTests();
}

module.exports = { runEmployeeTests };
