/**
 * @file        adminRoutes.js
 * @module      AdminRoutes
 * @description Express route definitions for system-level administrative tasks.
 * @layer       route
 * @author      Antigravity
 * @version     1.0.0
 */

const express = require('express');
const loyaltyController = require('../controllers/loyaltyController');
const eotwController = require('../controllers/eotwController');
const { authenticateToken, requireAdminRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/run-tier-check', authenticateToken, requireAdminRole, loyaltyController.runTierCheck);
router.post('/run-eotw-calculation', authenticateToken, requireAdminRole, eotwController.runEotwCalculation);

module.exports = router;
