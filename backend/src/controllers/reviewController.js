/**
 * @file        reviewController.js
 * @module      ReviewController
 * @description Controller handling customer order reviews and employee rating requests.
 * @layer       controller
 * @author      Antigravity
 * @version     1.0.0
 */

const reviewService = require('../services/reviewService');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  submitOrderReview
 * @summary   Express route handler to submit an order review
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function submitOrderReview(req, res, next) {
  try {
    const customerId = req.user.id;
    const { orderId, overallScore, foodQualityScore, speedScore, writtenComment, wouldOrderAgain, itemRatings } = req.body;

    if (!orderId || !overallScore || !foodQualityScore || !speedScore || wouldOrderAgain === undefined) {
      const error = new Error('Missing required fields.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const review = await reviewService.submitOrderReview({
      orderId,
      overallScore: parseInt(overallScore, 10),
      foodQualityScore: parseInt(foodQualityScore, 10),
      speedScore: parseInt(speedScore, 10),
      writtenComment,
      wouldOrderAgain,
      itemRatings,
    }, customerId);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  submitEmployeeRating
 * @summary   Express route handler to submit an employee rating
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function submitEmployeeRating(req, res, next) {
  try {
    const customerId = req.user.id;
    const { employeeId, orderId, serviceScore, writtenNote, tags } = req.body;

    if (!employeeId || !orderId || !serviceScore || !tags || !Array.isArray(tags)) {
      const error = new Error('Missing required fields.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const rating = await reviewService.submitEmployeeRating({
      employeeId,
      orderId,
      serviceScore: parseInt(serviceScore, 10),
      writtenNote,
      tags,
    }, customerId);

    res.status(201).json({
      success: true,
      data: rating,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  getOrderReview
 * @summary   Express route handler to get review details for an order
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getOrderReview(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await reviewService.getOrderReview(orderId, userId, userRole);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  getEmployeeRatings
 * @summary   Express route handler to fetch ratings for an employee
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getEmployeeRatings(req, res, next) {
  try {
    const { employeeId } = req.params;
    const includeExcluded = req.query.includeExcluded === 'true';

    const ratings = await reviewService.getEmployeeRatings(employeeId, includeExcluded);

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  excludeEmployeeRating
 * @summary   Express route handler to exclude a rating from employee metrics
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function excludeEmployeeRating(req, res, next) {
  try {
    const { ratingId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const updatedRating = await reviewService.excludeRating(ratingId, reason, adminId);

    res.json({
      success: true,
      data: updatedRating,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitOrderReview,
  submitEmployeeRating,
  getOrderReview,
  getEmployeeRatings,
  excludeEmployeeRating,
};
