/**
 * @file        eotwRoutes.js
 * @module      EotwRoutes
 * @description Express route definitions for public Employee of the Week queries.
 * @layer       route
 * @author      Antigravity
 * @version     1.0.0
 */

const express = require('express');
const eotwController = require('../controllers/eotwController');

const router = express.Router();

// Public endpoint, does not require authentication
router.get('/employee-of-week', eotwController.getCurrentEotw);

module.exports = router;
