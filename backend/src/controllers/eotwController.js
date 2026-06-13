/**
 * @file        eotwController.js
 * @module      EotwController
 * @description Controller handling Employee of the Week queries and triggers.
 * @layer       controller
 * @author      Antigravity
 * @version     1.0.0
 */

const eotwService = require('../services/eotwService');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  getCurrentEotw
 * @summary   Express route handler to retrieve current Employee of the Week selection details
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getCurrentEotw(req, res, next) {
  try {
    const winner = await eotwService.getCurrentEotw();
    if (!winner) {
      const error = new Error('No Employee of the Week selection found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }
    res.json({
      success: true,
      data: winner,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  runEotwCalculation
 * @summary   Express route handler to trigger weighted score calculations for a week
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function runEotwCalculation(req, res, next) {
  try {
    const { customDate } = req.body;
    const winner = await eotwService.calculateWeeklyEotw(customDate);
    res.json({
      success: true,
      data: winner,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentEotw,
  runEotwCalculation,
};
