/**
 * @file        authRoutes.js
 * @module      AuthRoutes
 * @description Express route definitions for authentication.
 * @layer       route
 * @author      Antigravity
 * @version     1.0.0
 */

const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/customer/login', authController.customerLogin);
router.post('/staff/login', authController.staffLogin);
router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.me);
router.put('/me', authenticateToken, authController.updateMe);

module.exports = router;
