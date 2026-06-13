/**
 * @file        reviewModel.js
 * @module      ReviewModel
 * @description Direct SQL model operations for customer order reviews and employee ratings.
 * @layer       model
 * @author      Antigravity
 * @version     1.0.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  findOrderById
 * @summary   Queries the database for an order by ID
 * @param     {string}  orderId  - Order unique identifier (UUID)
 * @returns   {Promise<object|null>} The order record or null if not found
 */
async function findOrderById(orderId) {
  const sqlText = 'SELECT * FROM orders WHERE id = $1';
  const result = await executeQuery(sqlText, [orderId]);
  return result.rows[0] || null;
}

/**
 * @function  findReviewByOrderAndCustomer
 * @summary   Checks if a review already exists for an order by a specific customer
 * @param     {string}  orderId     - Order ID
 * @param     {string}  customerId  - Customer ID
 * @returns   {Promise<object|null>} The review record or null if not found
 */
async function findReviewByOrderAndCustomer(orderId, customerId) {
  const sqlText = 'SELECT id FROM order_reviews WHERE order_id = $1 AND customer_id = $2';
  const result = await executeQuery(sqlText, [orderId, customerId]);
  return result.rows[0] || null;
}

/**
 * @function  createOrderReview
 * @summary   Inserts a new order review record into the database
 * @param     {object}  reviewData  - Order review details
 * @param     {object}  [client]    - Optional transaction client
 * @returns   {Promise<object>} The newly created review record
 */
async function createOrderReview(reviewData, client) {
  const { orderId, customerId, overallScore, foodQualityScore, speedScore, writtenComment, wouldOrderAgain } = reviewData;
  const sqlText = `
    INSERT INTO order_reviews (order_id, customer_id, overall_score, food_quality_score, speed_score, written_comment, would_order_again)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, order_id, customer_id, overall_score, food_quality_score, speed_score, written_comment, would_order_again, created_at;
  `;
  const params = [orderId, customerId, overallScore, foodQualityScore, speedScore, writtenComment || null, wouldOrderAgain];
  
  const result = client 
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
    
  return result.rows[0];
}

/**
 * @function  createOrderItemRating
 * @summary   Inserts a single item rating associated with an order review
 * @param     {object}  itemRatingData  - Order item rating details
 * @param     {object}  [client]        - Optional transaction client
 * @returns   {Promise<object>} The created item rating record
 */
async function createOrderItemRating(itemRatingData, client) {
  const { reviewId, orderItemId, productId, itemScore } = itemRatingData;
  const sqlText = `
    INSERT INTO order_item_ratings (review_id, order_item_id, product_id, item_score)
    VALUES ($1, $2, $3, $4)
    RETURNING id, review_id, order_item_id, product_id, item_score;
  `;
  const params = [reviewId, orderItemId, productId, itemScore];
  
  const result = client 
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
    
  return result.rows[0];
}

/**
 * @function  isEmployeeLinkedToOrder
 * @summary   Checks if an employee processed or delivered a specific order
 * @param     {string}  employeeId - Employee ID
 * @param     {string}  orderId    - Order ID
 * @returns   {Promise<boolean>} True if employee is linked, false otherwise
 */
async function isEmployeeLinkedToOrder(employeeId, orderId) {
  // Check if server employee on order
  const orderSql = 'SELECT server_employee_id FROM orders WHERE id = $1';
  const orderRes = await executeQuery(orderSql, [orderId]);
  if (orderRes.rows[0] && orderRes.rows[0].server_employee_id === employeeId) {
    return true;
  }

  // Check if delivery driver on deliveries
  const deliverySql = 'SELECT employee_id FROM deliveries WHERE order_id = $1';
  const deliveryRes = await executeQuery(deliverySql, [orderId]);
  if (deliveryRes.rows[0] && deliveryRes.rows[0].employee_id === employeeId) {
    return true;
  }

  return false;
}

/**
 * @function  findEmployeeRating
 * @summary   Checks if a customer has rated a specific employee on an order
 * @param     {string}  employeeId  - Employee ID
 * @param     {string}  orderId     - Order ID
 * @param     {string}  customerId  - Customer ID
 * @returns   {Promise<object|null>} The rating record or null if not found
 */
async function findEmployeeRating(employeeId, orderId, customerId) {
  const sqlText = 'SELECT id FROM employee_ratings WHERE employee_id = $1 AND order_id = $2 AND customer_id = $3';
  const result = await executeQuery(sqlText, [employeeId, orderId, customerId]);
  return result.rows[0] || null;
}

/**
 * @function  createEmployeeRating
 * @summary   Inserts a new employee rating record into the database
 * @param     {object}  ratingData  - Rating details
 * @param     {object}  [client]    - Optional transaction client
 * @returns   {Promise<object>} The newly created rating record
 */
async function createEmployeeRating(ratingData, client) {
  const { employeeId, orderId, customerId, serviceScore, writtenNote, tags } = ratingData;
  const sqlText = `
    INSERT INTO employee_ratings (employee_id, order_id, customer_id, service_score, written_note, tags)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, employee_id, order_id, customer_id, service_score, written_note, tags, is_excluded, created_at;
  `;
  const params = [employeeId, orderId, customerId, serviceScore, writtenNote || null, tags];
  
  const result = client 
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
    
  return result.rows[0];
}

/**
 * @function  findReviewWithDetails
 * @summary   Retrieves an order review and its associated order item ratings
 * @param     {string}  orderId - Order ID
 * @returns   {Promise<object|null>} The review with detail records or null
 */
async function findReviewWithDetails(orderId) {
  const reviewSql = 'SELECT * FROM order_reviews WHERE order_id = $1';
  const reviewRes = await executeQuery(reviewSql, [orderId]);
  if (!reviewRes.rows[0]) {
    return null;
  }

  const review = reviewRes.rows[0];
  const itemsSql = 'SELECT * FROM order_item_ratings WHERE review_id = $1';
  const itemsRes = await executeQuery(itemsSql, [review.id]);
  
  return {
    ...review,
    itemRatings: itemsRes.rows,
  };
}

/**
 * @function  findEmployeeRatings
 * @summary   Retrieves all non-excluded ratings (or all if specified) for an employee
 * @param     {string}   employeeId     - Employee ID
 * @param     {boolean}  includeExcluded - Whether to include administratively excluded ratings
 * @returns   {Promise<Array>} List of rating records
 */
async function findEmployeeRatings(employeeId, includeExcluded = false) {
  let sqlText = 'SELECT * FROM employee_ratings WHERE employee_id = $1';
  if (!includeExcluded) {
    sqlText += ' AND is_excluded = false';
  }
  sqlText += ' ORDER BY created_at DESC';
  
  const result = await executeQuery(sqlText, [employeeId]);
  return result.rows;
}

/**
 * @function  excludeEmployeeRating
 * @summary   Allows administration to exclude an employee rating from metrics with a reason
 * @param     {string}  ratingId       - Rating ID
 * @param     {string}  excludedReason - Reason for exclusion
 * @param     {string}  adminId        - Admin employee ID
 * @returns   {Promise<object|null>} The updated rating record or null if not found
 */
async function excludeEmployeeRating(ratingId, excludedReason, adminId) {
  const sqlText = `
    UPDATE employee_ratings
    SET is_excluded = true, excluded_reason = $1, excluded_by = $2, excluded_at = now()
    WHERE id = $3
    RETURNING *;
  `;
  const result = await executeQuery(sqlText, [excludedReason, adminId, ratingId]);
  return result.rows[0] || null;
}

module.exports = {
  findOrderById,
  findReviewByOrderAndCustomer,
  createOrderReview,
  createOrderItemRating,
  isEmployeeLinkedToOrder,
  findEmployeeRating,
  createEmployeeRating,
  findReviewWithDetails,
  findEmployeeRatings,
  excludeEmployeeRating,
};
