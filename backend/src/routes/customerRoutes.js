/**
 * @file        customerRoutes.js
 * @module      CustomerRoutes
 * @description Express route definitions for customer-related endpoints.
 * @layer       route
 * @author      Architect Agent
 * @version     1.0.0
 */

const express = require('express');
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Define route using kebab-case for the path
router.get('/loyalty-points/:customerId', verifyToken, customerController.getCustomerLoyalty);

module.exports = router;
