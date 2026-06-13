/**
 * @file        loyaltyService.js
 * @module      services
 * @description Centralized service layer for executing loyalty-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Initialize mock loyalty account and ledger
const DEFAULT_LOYALTY = {
  customerId: 101,
  pointsBalance: 250,
  tier: "Crust", // Dough (<100), Crust (100-499), Legend (>=500)
  referralCode: "PIZZA-JOIN-101-JD",
};

const DEFAULT_LEDGER = [
  { id: 1, date: "2026-06-01", eventType: "Earned (Order #5002)", pointsDelta: 60, balanceAfter: 250 },
  { id: 2, date: "2026-06-01", eventType: "Redemption (Order #5002)", pointsDelta: -100, balanceAfter: 190 },
  { id: 3, date: "2026-05-28", eventType: "Earned (Order #5001)", pointsDelta: 120, balanceAfter: 290 },
  { id: 4, date: "2026-05-15", eventType: "Signup Reward", pointsDelta: 170, balanceAfter: 170 }
];

if (!localStorage.getItem('mock_loyalty')) {
  localStorage.setItem('mock_loyalty', JSON.stringify(DEFAULT_LOYALTY));
}
if (!localStorage.getItem('mock_loyalty_ledger')) {
  localStorage.setItem('mock_loyalty_ledger', JSON.stringify(DEFAULT_LEDGER));
}

/**
 * @function  getAccount
 * @summary   Retrieves rewards account details for a customer
 * @param     {number} customerId - Customer unique identifier
 * @returns   {Promise<object>} Account data including points balance, tier, and value
 * @throws    {object} Formatted error details
 */
export async function getAccount(customerId) {
  try {
    const res = await apiService.get(`/loyalty/account/${customerId}`);
    return res.data.account;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: getAccount for customer ${customerId} failed, returning mock details`);
      const loyalty = JSON.parse(localStorage.getItem('mock_loyalty') || '{}');
      
      // Compute tier dynamically based on points
      const points = loyalty.pointsBalance || 0;
      let tier = "Dough";
      let tierColor = "gray";
      let nextThreshold = 100;
      
      if (points >= 500) {
        tier = "Legend";
        tierColor = "coral";
        nextThreshold = 1000; // Cap or next level
      } else if (points >= 100) {
        tier = "Crust";
        tierColor = "amber";
        nextThreshold = 500;
      }
      
      // Estimated Rupee value: 10 points = 1 Rupee (₹)
      const estimatedValue = points / 10;
      
      return {
        customerId: Number(customerId),
        pointsBalance: points,
        tier,
        tierColor,
        nextThreshold,
        progressPercent: Math.min(100, (points / nextThreshold) * 100),
        estimatedValue,
        referralCode: loyalty.referralCode || "PIZZA-JOIN-101-JD"
      };
    }
    throw err;
  }
}

/**
 * @function  getLedger
 * @summary   Retrieves a paginated list of points transactions
 * @param     {number} customerId - Customer identifier
 * @param     {number} page - Page offset number
 * @param     {number} limit - Items per page
 * @returns   {Promise<object>} Ledger list and pagination metadata
 * @throws    {object} Formatted error details
 */
export async function getLedger(customerId, page = 1, limit = 5) {
  try {
    const res = await apiService.get(`/loyalty/ledger/${customerId}`, { params: { page, limit } });
    return res.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: getLedger for ${customerId} failed, returning mock ledger`);
      const ledger = JSON.parse(localStorage.getItem('mock_loyalty_ledger') || '[]');
      
      const startIndex = (page - 1) * limit;
      const paginatedLedger = ledger.slice(startIndex, startIndex + limit);

      return {
        ledger: paginatedLedger,
        totalCount: ledger.length,
        totalPages: Math.ceil(ledger.length / limit),
        currentPage: page
      };
    }
    throw err;
  }
}

/**
 * @function  redeemPoints
 * @summary   Redeems a portion of points for checkout discount
 * @param     {number} customerId - Customer identifier
 * @param     {number} points - Points to redeem
 * @returns   {Promise<object>} Status indicating final points balance
 * @throws    {object} Formatted error details
 */
export async function redeemPoints(customerId, points) {
  try {
    const res = await apiService.post(`/loyalty/redeem`, { customerId, points });
    return res.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: redeemPoints failed, executing mock redemption`);
      const loyalty = JSON.parse(localStorage.getItem('mock_loyalty') || '{}');
      
      if (loyalty.pointsBalance < points) {
        throw { code: 'INSUFFICIENT_POINTS', message: 'Insufficient points balance for redemption.' };
      }
      
      loyalty.pointsBalance = Math.max(0, loyalty.pointsBalance - points);
      localStorage.setItem('mock_loyalty', JSON.stringify(loyalty));

      const ledger = JSON.parse(localStorage.getItem('mock_loyalty_ledger') || '[]');
      ledger.unshift({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        eventType: "Redemption",
        pointsDelta: -points,
        balanceAfter: loyalty.pointsBalance
      });
      localStorage.setItem('mock_loyalty_ledger', JSON.stringify(ledger));

      return {
        success: true,
        pointsBalance: loyalty.pointsBalance,
        discountAmount: points / 10
      };
    }
    throw err;
  }
}

const loyaltyService = {
  getAccount,
  getLedger,
  redeemPoints,
};

export default loyaltyService;
