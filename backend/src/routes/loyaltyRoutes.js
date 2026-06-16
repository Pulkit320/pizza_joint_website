/**
 * @file        loyaltyRoutes.js
 * @module      LoyaltyRoutes
 * @description Express route definitions for customer loyalty accounts and ledger logs.
 * @layer       route
 * @author      Antigravity
 * @version     1.0.0
 */

const express = require('express');
const loyaltyController = require('../controllers/loyaltyController');
const { authenticateToken, requireRole, requireAdminRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/account/:id?', authenticateToken, loyaltyController.getCustomerLoyalty);
router.get('/ledger/:id?', authenticateToken, loyaltyController.getLedgerHistory);
router.post('/redeem', authenticateToken, requireRole('customer'), loyaltyController.redeemPoints);

// Admin specific loyalty routes
router.get('/admin/overview', authenticateToken, requireAdminRole, loyaltyController.getAdminOverview);
router.post('/admin/grant', authenticateToken, requireAdminRole, loyaltyController.adminGrantPoints);
router.get('/admin/customer/:id', authenticateToken, requireAdminRole, loyaltyController.getCustomerLedgerAdmin);

module.exports = router;
