/**
 * @file        customerController.js
 * @module      CustomerController
 * @description Controller handling customer route logic.
 * @layer       controller
 * @author      Architect Agent
 * @version     1.0.0
 */

const loyaltyService = require('../services/loyaltyService');

/**
 * @function  getCustomerLoyalty
 * @summary   Express route handler to retrieve customer loyalty information
 * @param     {object}  req  - Express request object
 * @param     {object}  res  - Express response object
 * @returns   {Promise<void>}
 * @throws    {Error} When service call fails
 */
async function getCustomerLoyalty(req, res) {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const loyaltyDetails = await loyaltyService.calculateCustomerPoints(customerId);
    res.json({
      customerId,
      loyaltyPoints: loyaltyDetails,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getCustomerLoyalty,
};
