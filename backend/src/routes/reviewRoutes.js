/**
 * @file        reviewRoutes.js
 * @module      ReviewRoutes
 * @description Express route definitions for order reviews and employee ratings.
 * @layer       route
 * @author      Antigravity
 * @version     1.0.0
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireRole, requireAdminRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/order', authenticateToken, requireRole('customer'), reviewController.submitOrderReview);
router.post('/employee', authenticateToken, requireRole('customer'), reviewController.submitEmployeeRating);
router.get('/order/:orderId', authenticateToken, reviewController.getOrderReview);
router.get('/employee/:employeeId', authenticateToken, requireAdminRole, reviewController.getEmployeeRatings);
router.post('/employee/rating/:ratingId/exclude', authenticateToken, requireAdminRole, reviewController.excludeEmployeeRating);

module.exports = router;
