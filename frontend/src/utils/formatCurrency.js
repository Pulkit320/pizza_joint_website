/**
 * @file        formatCurrency.js
 * @module      FormatCurrency
 * @description Frontend currency utility helper.
 * @layer       util
 * @author      Architect Agent
 * @version     1.0.0
 */

/**
 * @function  formatRupee
 * @summary   Formats a numeric value into a Rupee currency string representation
 * @param     {number}  amount - Numeric price value to format
 * @returns   {string}  Formatted price string prefixed with ₹ symbol
 */
function formatRupee(amount) {
  if (typeof amount !== 'number') {
    return '₹0.00';
  }
  return `₹${amount.toFixed(2)}`;
}

module.exports = {
  formatRupee,
};
