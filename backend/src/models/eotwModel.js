/**
 * @file        eotwModel.js
 * @module      EotwModel
 * @description Direct SQL model operations for Employee of the Week selection metrics.
 * @layer       model
 * @author      Antigravity
 * @version     1.0.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  findEligibleEmployees
 * @summary   Finds all employees who worked at least one shift in the evaluated week
 * @param     {string}  startDate - Evaluated week start date (YYYY-MM-DD)
 * @param     {string}  endDate   - Evaluated week end date (YYYY-MM-DD)
 * @returns   {Promise<Array>} List of employee records
 */
async function findEligibleEmployees(startDate, endDate) {
  const sqlText = `
    SELECT DISTINCT e.id, e.first_name, e.last_name, e.email, e.role
    FROM employees e
    JOIN shifts s ON e.id = s.employee_id
    WHERE s.shift_date BETWEEN $1 AND $2;
  `;
  const result = await executeQuery(sqlText, [startDate, endDate]);
  return result.rows;
}

/**
 * @function  getEmployeeShiftStats
 * @summary   Computes shifts count and punctuality for an employee during the week
 * @param     {string}  employeeId - Employee ID
 * @param     {string}  startDate  - Week start date (YYYY-MM-DD)
 * @param     {string}  endDate    - Week end date (YYYY-MM-DD)
 * @returns   {Promise<object>} Punctuality stats
 */
async function getEmployeeShiftStats(employeeId, startDate, endDate) {
  const sqlText = `
    SELECT 
      COUNT(*) AS total_shifts,
      COUNT(CASE WHEN is_late = false THEN 1 END) AS on_time_shifts
    FROM shifts
    WHERE employee_id = $1 AND shift_date BETWEEN $2 AND $3;
  `;
  const result = await executeQuery(sqlText, [employeeId, startDate, endDate]);
  return {
    totalShifts: parseInt(result.rows[0].total_shifts || '0', 10),
    onTimeShifts: parseInt(result.rows[0].on_time_shifts || '0', 10),
  };
}

/**
 * @function  getEmployeeRatingsStats
 * @summary   Queries average service rating and rating count for an employee in the evaluated week
 * @param     {string}  employeeId - Employee ID
 * @param     {string}  startTime  - Week start timestamp
 * @param     {string}  endTime    - Week end timestamp
 * @returns   {Promise<object>} Ratings metrics
 */
async function getEmployeeRatingsStats(employeeId, startTime, endTime) {
  const sqlText = `
    SELECT 
      COUNT(*) AS rating_count,
      COALESCE(AVG(service_score), 0) AS avg_score
    FROM employee_ratings
    WHERE employee_id = $1 
      AND is_excluded = false 
      AND created_at BETWEEN $2 AND $3;
  `;
  const result = await executeQuery(sqlText, [employeeId, startTime, endTime]);
  return {
    ratingCount: parseInt(result.rows[0].rating_count || '0', 10),
    avgServiceRating: parseFloat(result.rows[0].avg_score || '0'),
  };
}

/**
 * @function  getStoreWideAverageRating
 * @summary   Queries the global average service rating for all employees in the evaluated week
 * @param     {string}  startTime - Week start timestamp
 * @param     {string}  endTime   - Week end timestamp
 * @returns   {Promise<number>} Global average rating
 */
async function getStoreWideAverageRating(startTime, endTime) {
  const sqlText = `
    SELECT COALESCE(AVG(service_score), 0) AS avg_score 
    FROM employee_ratings 
    WHERE is_excluded = false 
      AND created_at BETWEEN $1 AND $2;
  `;
  const result = await executeQuery(sqlText, [startTime, endTime]);
  return parseFloat(result.rows[0].avg_score || '0');
}

/**
 * @function  getEmployeeProcessedOrdersCount
 * @summary   Queries count of completed orders processed/delivered by an employee during the week
 * @param     {string}  employeeId - Employee ID
 * @param     {string}  startTime  - Week start timestamp
 * @param     {string}  endTime    - Week end timestamp
 * @returns   {Promise<number>} Number of processed orders
 */
async function getEmployeeProcessedOrdersCount(employeeId, startTime, endTime) {
  const sqlText = `
    SELECT COUNT(DISTINCT o.id) AS total
    FROM orders o
    LEFT JOIN deliveries d ON o.id = d.order_id
    WHERE (o.server_employee_id = $1 OR d.employee_id = $1)
      AND o.status IN ('delivered', 'collected')
      AND o.created_at BETWEEN $2 AND $3;
  `;
  const result = await executeQuery(sqlText, [employeeId, startTime, endTime]);
  return parseInt(result.rows[0].total || '0', 10);
}

/**
 * @function  getStoreTotalProcessedOrdersCount
 * @summary   Queries the total completed orders processed by the entire store during the week
 * @param     {string}  startTime - Week start timestamp
 * @param     {string}  endTime   - Week end timestamp
 * @returns   {Promise<number>} Total processed orders
 */
async function getStoreTotalProcessedOrdersCount(startTime, endTime) {
  const sqlText = `
    SELECT COUNT(*) AS total
    FROM orders
    WHERE status IN ('delivered', 'collected')
      AND created_at BETWEEN $1 AND $2;
  `;
  const result = await executeQuery(sqlText, [startTime, endTime]);
  return parseInt(result.rows[0].total || '0', 10);
}

/**
 * @function  upsertEotwSelection
 * @summary   Inserts or updates the Employee of the Week selection record
 * @param     {object}  selectionData - Details of selection
 * @returns   {Promise<object>} The saved EOTW record
 */
async function upsertEotwSelection(selectionData) {
  const { employeeId, weekStart, weekEnd, score, avgServiceRating, ordersProcessedRatio, punctualityScore } = selectionData;
  const sqlText = `
    INSERT INTO eotw_selections (employee_id, week_start, week_end, score, avg_service_rating, orders_processed_ratio, punctuality_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (week_start) 
    DO UPDATE SET 
      employee_id = EXCLUDED.employee_id,
      score = EXCLUDED.score,
      avg_service_rating = EXCLUDED.avg_service_rating,
      orders_processed_ratio = EXCLUDED.orders_processed_ratio,
      punctuality_score = EXCLUDED.punctuality_score,
      created_at = now()
    RETURNING *;
  `;
  const result = await executeQuery(sqlText, [
    employeeId,
    weekStart,
    weekEnd,
    score,
    avgServiceRating,
    ordersProcessedRatio,
    punctualityScore,
  ]);
  return result.rows[0];
}

/**
 * @function  getCurrentEotw
 * @summary   Retrieves the most recent Employee of the Week selection with employee details
 * @returns   {Promise<object|null>} EOTW detail record or null
 */
async function getCurrentEotw() {
  const sqlText = `
    SELECT 
      s.id,
      s.employee_id AS "employeeId",
      s.week_start AS "weekStart",
      s.week_end AS "weekEnd",
      s.score,
      s.avg_service_rating AS "avgServiceRating",
      s.orders_processed_ratio AS "ordersProcessedRatio",
      s.punctuality_score AS "punctualityScore",
      s.created_at AS "createdAt",
      e.first_name AS "firstName",
      e.last_name AS "lastName",
      e.email,
      e.role
    FROM eotw_selections s
    JOIN employees e ON s.employee_id = e.id
    ORDER BY s.week_start DESC
    LIMIT 1;
  `;
  const result = await executeQuery(sqlText);
  return result.rows[0] || null;
}

module.exports = {
  findEligibleEmployees,
  getEmployeeShiftStats,
  getEmployeeRatingsStats,
  getStoreWideAverageRating,
  getEmployeeProcessedOrdersCount,
  getStoreTotalProcessedOrdersCount,
  upsertEotwSelection,
  getCurrentEotw,
};
