/**
 * @file        dateHelper.js
 * @module      DateHelper
 * @description Date utility helper functions.
 * @layer       util
 * @author      Architect Agent
 * @version     1.0.0
 */

/**
 * @function  formatIsoString
 * @summary   Formats a Date object into an ISO string representation
 * @param     {Date}   dateVal  - Date object to format
 * @returns   {string} The ISO string formatted date
 * @throws    {TypeError} When the input is not a valid Date object
 */
function formatIsoString(dateVal) {
  if (!(dateVal instanceof Date) || isNaN(dateVal.getTime())) {
    throw new TypeError('Invalid date value provided');
  }
  return dateVal.toISOString();
}

module.exports = {
  formatIsoString,
};
