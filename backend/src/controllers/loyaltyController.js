/**
 * @file        loyaltyController.js
 * @module      LoyaltyController
 * @description Controller handling loyalty points queries, redemptions, and admin operations.
 * @layer       controller
 * @author      Antigravity
 * @version     1.0.0
 */

const loyaltyService = require('../services/loyaltyService');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @function  getCustomerLoyalty
 * @summary   Express route handler to fetch loyalty points and tier progress
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getCustomerLoyalty(req, res, next) {
  try {
    const customerId = req.user.id;
    const details = await loyaltyService.getCustomerLoyalty(customerId);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  getLedgerHistory
 * @summary   Express route handler to retrieve paginated points ledger logs
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getLedgerHistory(req, res, next) {
  try {
    const customerId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    const history = await loyaltyService.getLedgerHistory(customerId, page, limit);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  redeemPoints
 * @summary   Express route handler to apply points for checkout discount
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function redeemPoints(req, res, next) {
  try {
    const customerId = req.user.id;
    const { orderId, pointsToRedeem } = req.body;

    if (!orderId || pointsToRedeem === undefined) {
      const error = new Error('Missing orderId or pointsToRedeem.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const updatedAccount = await loyaltyService.redeemPoints(
      customerId,
      parseInt(pointsToRedeem, 10),
      orderId
    );

    res.json({
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  getAdminOverview
 * @summary   Express route handler to query global loyalty statistics
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getAdminOverview(req, res, next) {
  try {
    const stats = await loyaltyService.getAdminOverview();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  adminGrantPoints
 * @summary   Express route handler to manually adjust customer point balances
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function adminGrantPoints(req, res, next) {
  try {
    const adminId = req.user.id;
    const { customerId, pointsDelta, note } = req.body;

    if (!customerId || pointsDelta === undefined || !note) {
      const error = new Error('Missing customerId, pointsDelta, or note.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    const updatedAccount = await loyaltyService.adminGrantPoints({
      customerId,
      pointsDelta: parseInt(pointsDelta, 10),
      note,
    }, adminId);

    res.json({
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  getCustomerLedgerAdmin
 * @summary   Express route handler to query points ledger history for administrative audit
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function getCustomerLedgerAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const entries = await loyaltyService.getCustomerLedgerAdmin(id);
    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function  runTierCheck
 * @summary   Express route handler to run annual tier sweeps and point expirations
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @param     {function} next - Express next function
 * @returns   {Promise<void>}
 */
async function runTierCheck(req, res, next) {
  try {
    const result = await loyaltyService.runTierDowngradesCheck();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomerLoyalty,
  getLedgerHistory,
  redeemPoints,
  getAdminOverview,
  adminGrantPoints,
  getCustomerLedgerAdmin,
  runTierCheck,
};
