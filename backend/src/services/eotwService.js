/**
 * @file        eotwService.js
 * @module      EotwService
 * @description Service managing prior-week Employee of the Week calculations and scoring.
 * @layer       service
 * @author      Antigravity
 * @version     1.0.0
 */

const eotwModel = require('../models/eotwModel');
const authModel = require('../models/authModel');
const loyaltyService = require('./loyaltyService');
const { pool } = require('../config/db');
const ErrorCodes = require('../utils/errorCodes');

class EotwService {
  /**
   * @function  calculateWeeklyEotw
   * @summary   Runs scoring algorithms to select the Employee of the Week for the prior calendar week
   * @param     {string}  [customDate] - Optional ISO/YYYY-MM-DD date string to calculate relative to
   * @returns   {Promise<object>} The selected employee details and their winning stats
   */
  async calculateWeeklyEotw(customDate) {
    const referenceDate = customDate ? new Date(customDate) : new Date();

    // Determine the prior calendar week Monday and Sunday
    const day = referenceDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    // If Sunday, go back 13 days to get Monday of last week. Otherwise go back day + 6 days.
    const diffToPrevMonday = day === 0 ? 13 : day + 6;
    
    const prevMonday = new Date(referenceDate);
    prevMonday.setDate(referenceDate.getDate() - diffToPrevMonday);
    prevMonday.setHours(0, 0, 0, 0);

    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);
    prevSunday.setHours(23, 59, 59, 999);

    const weekStartStr = prevMonday.toISOString().split('T')[0];
    const weekEndStr = prevSunday.toISOString().split('T')[0];
    const startTimeStamp = prevMonday.toISOString();
    const endTimeStamp = prevSunday.toISOString();

    // 1. Fetch all eligible employees
    const eligibleEmployees = await eotwModel.findEligibleEmployees(weekStartStr, weekEndStr);
    if (!eligibleEmployees || eligibleEmployees.length === 0) {
      const error = new Error('No eligible employees found who worked shifts in the evaluated week.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    // 2. Fetch global store stats for the week
    const storeWideAvgRating = await eotwModel.getStoreWideAverageRating(startTimeStamp, endTimeStamp);
    const storeTotalOrders = await eotwModel.getStoreTotalProcessedOrdersCount(startTimeStamp, endTimeStamp);

    let winner = null;
    let highestScore = -1;
    const candidates = [];

    // 3. Score each employee
    for (const employee of eligibleEmployees) {
      const shiftStats = await eotwModel.getEmployeeShiftStats(employee.id, weekStartStr, weekEndStr);
      const ratingStats = await eotwModel.getEmployeeRatingsStats(employee.id, startTimeStamp, endTimeStamp);
      const employeeOrders = await eotwModel.getEmployeeProcessedOrdersCount(employee.id, startTimeStamp, endTimeStamp);

      // Average Service Rating fallback (1.0 to 5.0)
      const avgServiceRating = ratingStats.ratingCount > 0 
        ? ratingStats.avgServiceRating 
        : (storeWideAvgRating > 0 ? storeWideAvgRating : 5.0);

      // Orders Processed Ratio (scaled 0 to 5)
      const ordersProcessedRatio = storeTotalOrders > 0 
        ? (employeeOrders / storeTotalOrders) 
        : 0.0;

      // Punctuality Score (scaled 0 to 5)
      const punctualityScore = shiftStats.totalShifts > 0 
        ? (shiftStats.onTimeShifts / shiftStats.totalShifts) 
        : 0.0;

      // Calculate final weighted score
      const score = (0.5 * avgServiceRating) + (0.3 * ordersProcessedRatio * 5) + (0.2 * punctualityScore * 5);

      const candidate = {
        employeeId: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: employee.email,
        role: employee.role,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        score: parseFloat(score.toFixed(3)),
        avgServiceRating: parseFloat(avgServiceRating.toFixed(2)),
        ordersProcessedRatio: parseFloat(ordersProcessedRatio.toFixed(4)),
        punctualityScore: parseFloat(punctualityScore.toFixed(2)),
      };

      candidates.push(candidate);

      if (score > highestScore) {
        highestScore = score;
        winner = candidate;
      }
    }

    if (!winner) {
      throw new Error('Failed to determine Employee of the Week.');
    }

    // 4. Save winner and credit points in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const savedSelection = await eotwModel.upsertEotwSelection({
        employeeId: winner.employeeId,
        weekStart: winner.weekStart,
        weekEnd: winner.weekEnd,
        score: winner.score,
        avgServiceRating: winner.avgServiceRating,
        ordersProcessedRatio: winner.ordersProcessedRatio,
        punctualityScore: winner.punctualityScore,
      });

      // Credit 500 loyalty points if employee has a customer profile (matched by email)
      const customer = await authModel.findCustomerByEmail(winner.email);
      let pointsCredited = false;
      if (customer) {
        await loyaltyService.earnPoints({
          customerId: customer.id,
          pointsDelta: 500,
          eventType: 'bonus_earn',
          note: `Employee of the Week selection bonus for week starting ${winner.weekStart}`,
        }, client);
        pointsCredited = true;
      }

      await client.query('COMMIT');

      return {
        ...winner,
        id: savedSelection.id,
        pointsCreditedToCustomer: pointsCredited,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * @function  getCurrentEotw
   * @summary   Retrieves details of the current Employee of the Week selection
   * @returns   {Promise<object|null>} Winning selection details
   */
  async getCurrentEotw() {
    return await eotwModel.getCurrentEotw();
  }
}

module.exports = new EotwService();
