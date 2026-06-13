/**
 * @file        reviewService.js
 * @module      ReviewService
 * @description Business logic layer for managing order reviews, employee ratings, and eligibility rules.
 * @layer       service
 * @author      Antigravity
 * @version     1.0.0
 */

const reviewModel = require('../models/reviewModel');
const loyaltyService = require('./loyaltyService');
const { pool } = require('../config/db');
const ErrorCodes = require('../utils/errorCodes');

class ReviewService {
  /**
   * @function  submitOrderReview
   * @summary   Validates eligibility and saves a customer review for a completed order
   * @param     {object}  reviewData  - Review data
   * @param     {string}  customerId  - Customer ID submitting the review
   * @returns   {Promise<object>} The submitted review record
   */
  async submitOrderReview(reviewData, customerId) {
    const { orderId, overallScore, foodQualityScore, speedScore, writtenComment, wouldOrderAgain, itemRatings } = reviewData;

    // 1. Fetch the order
    const order = await reviewModel.findOrderById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // 2. Verify order ownership
    if (order.customer_id !== customerId) {
      const error = new Error('Access forbidden. You do not own this order.');
      error.statusCode = 403;
      error.code = ErrorCodes.FORBIDDEN;
      throw error;
    }

    // 3. Verify order is completed ('delivered' or 'collected')
    if (order.status !== 'delivered' && order.status !== 'collected') {
      const error = new Error('Review cannot be submitted for incomplete orders.');
      error.statusCode = 400;
      error.code = ErrorCodes.ORDER_NOT_COMPLETED;
      throw error;
    }

    // 4. Verify review window is within 7 days
    const completionDate = order.status === 'delivered' 
      ? new Date(order.delivered_at) 
      : new Date(order.collected_at);
      
    const diffTime = Math.abs(new Date() - completionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      const error = new Error('Review window has expired. Reviews must be submitted within 7 days.');
      error.statusCode = 400;
      error.code = ErrorCodes.REVIEW_WINDOW_EXPIRED;
      throw error;
    }

    // 5. Verify no existing review
    const existingReview = await reviewModel.findReviewByOrderAndCustomer(orderId, customerId);
    if (existingReview) {
      const error = new Error('A review has already been submitted for this order.');
      error.statusCode = 409;
      error.code = ErrorCodes.DUPLICATE_REVIEW;
      throw error;
    }

    // 6. Save review, item ratings, and earn points in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const review = await reviewModel.createOrderReview({
        orderId,
        customerId,
        overallScore,
        foodQualityScore,
        speedScore,
        writtenComment,
        wouldOrderAgain,
      }, client);

      // Insert order item ratings if provided
      if (itemRatings && Array.isArray(itemRatings)) {
        for (const item of itemRatings) {
          await reviewModel.createOrderItemRating({
            reviewId: review.id,
            orderItemId: item.orderItemId,
            productId: item.productId,
            itemScore: item.itemScore,
          }, client);
        }
      }

      // Credit 10 loyalty points for review
      await loyaltyService.earnPoints({
        customerId,
        pointsDelta: 10,
        eventType: 'review_earn',
        orderId,
        note: `Review submitted for order ${orderId}`,
      }, client);

      await client.query('COMMIT');
      return review;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * @function  submitEmployeeRating
   * @summary   Validates eligibility and saves a rating for an employee linked to an order
   * @param     {object}  ratingData  - Employee rating details
   * @param     {string}  customerId  - Customer ID leaving the rating
   * @returns   {Promise<object>} The created employee rating record
   */
  async submitEmployeeRating(ratingData, customerId) {
    const { employeeId, orderId, serviceScore, writtenNote, tags } = ratingData;

    // 1. Fetch order
    const order = await reviewModel.findOrderById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // 2. Verify order ownership
    if (order.customer_id !== customerId) {
      const error = new Error('Access forbidden. You do not own this order.');
      error.statusCode = 403;
      error.code = ErrorCodes.FORBIDDEN;
      throw error;
    }

    // 3. Verify employee link to order
    const isLinked = await reviewModel.isEmployeeLinkedToOrder(employeeId, orderId);
    if (!isLinked) {
      const error = new Error('The specified employee was not linked to this order.');
      error.statusCode = 400;
      error.code = ErrorCodes.INVALID_EMPLOYEE_RATING;
      throw error;
    }

    // 4. Verify no duplicate rating
    const existingRating = await reviewModel.findEmployeeRating(employeeId, orderId, customerId);
    if (existingRating) {
      const error = new Error('You have already rated this employee for this order.');
      error.statusCode = 409;
      error.code = ErrorCodes.DUPLICATE_REVIEW;
      throw error;
    }

    // 5. Save employee rating and credit loyalty points in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const rating = await reviewModel.createEmployeeRating({
        employeeId,
        orderId,
        customerId,
        serviceScore,
        writtenNote,
        tags,
      }, client);

      // Credit 5 loyalty points for employee rating
      await loyaltyService.earnPoints({
        customerId,
        pointsDelta: 5,
        eventType: 'employee_rating_earn',
        orderId,
        note: `Rated employee ${employeeId} for order ${orderId}`,
      }, client);

      await client.query('COMMIT');
      return rating;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * @function  getOrderReview
   * @summary   Retrieves review details for a specific order if authorized
   * @param     {string}  orderId     - Order ID
   * @param     {string}  userId      - Requesting user ID
   * @param     {string}  userRole    - Requesting user role
   * @returns   {Promise<object>} The order review with item ratings
   * @throws    {Error} If order or review is not found, or if user is unauthorized
   */
  async getOrderReview(orderId, userId, userRole) {
    const order = await reviewModel.findOrderById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // Authorization: Only the owner (customer) or staff/admin can view reviews
    if (userRole === 'customer' && order.customer_id !== userId) {
      const error = new Error('Access forbidden. You do not own this order.');
      error.statusCode = 403;
      error.code = ErrorCodes.FORBIDDEN;
      throw error;
    }

    const review = await reviewModel.findReviewWithDetails(orderId);
    if (!review) {
      const error = new Error('No review found for this order.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    return review;
  }

  /**
   * @function  getEmployeeRatings
   * @summary   Retrieves all reviews associated with an employee
   * @param     {string}   employeeId     - Employee ID
   * @param     {boolean}  includeExcluded - Whether to include administratively excluded ratings
   * @returns   {Promise<Array>} List of rating records
   */
  async getEmployeeRatings(employeeId, includeExcluded = false) {
    return await reviewModel.findEmployeeRatings(employeeId, includeExcluded);
  }

  /**
   * @function  excludeRating
   * @summary   Allows an admin to exclude an employee rating from metrics
   * @param     {string}  ratingId       - Rating ID
   * @param     {string}  excludedReason - Reason for exclusion
   * @param     {string}  adminId        - Admin ID
   * @returns   {Promise<object>} The updated rating record
   */
  async excludeRating(ratingId, excludedReason, adminId) {
    if (!excludedReason || excludedReason.trim() === '') {
      const error = new Error('Exclusion reason is required.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const rating = await reviewModel.excludeEmployeeRating(ratingId, excludedReason, adminId);
    if (!rating) {
      const error = new Error('Employee rating not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    return rating;
  }
}

module.exports = new ReviewService();
