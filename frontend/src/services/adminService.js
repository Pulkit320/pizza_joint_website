/**
 * @file        adminService.js
 * @module      services
 * @description Centralized service layer for executing administrative analytics and loyalty actions.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Fallback Mock Analytics data
const MOCK_SALES_ANALYTICS = {
  summary: {
    todayRevenue: 18450,
    ordersToday: 32,
    avgReviewScore: 4.8,
    lowScoreAlertThreshold: 4.2,
    employeeOfWeekName: "Marco Silva",
    employeeOfWeekScore: 4.9,
  },
  dailySales: [
    { date: "May 28", revenue: 12500, orders: 22 },
    { date: "May 29", revenue: 14200, orders: 25 },
    { date: "May 30", revenue: 19800, orders: 35 },
    { date: "May 31", revenue: 22400, orders: 38 },
    { date: "June 01", revenue: 15600, orders: 28 },
    { date: "June 02", revenue: 17800, orders: 31 },
    { date: "June 03", revenue: 18450, orders: 32 }
  ],
  popularPizzas: [
    { name: "Hot Honey Pepperoni", orders: 124, revenue: 74276 },
    { name: "Neapolitan Margherita", orders: 98, revenue: 48902 },
    { name: "Truffle Mushroom", orders: 62, revenue: 40238 },
    { name: "Peri-Peri Chicken", orders: 48, revenue: 26352 },
    { name: "Garden Pesto Veggie", orders: 34, revenue: 17986 }
  ]
};

/**
 * @function  getSalesAnalytics
 * @summary   Fetches admin sales dashboard statistics and chart details
 * @returns   {Promise<object>} Sales summary and breakdown arrays
 * @throws    {object} Formatted error details
 */
export async function getSalesAnalytics() {
  try {
    const res = await apiService.get('/admin/sales-analytics');
    return res.data.analytics;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: getSalesAnalytics failed, returning mock analytics');
      
      // Compute dynamically from actual orders if possible
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      const reviews = JSON.parse(localStorage.getItem('mock_reviews') || '[]');
      
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
      
      const avgReview = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.ratings.overall, 0) / reviews.length).toFixed(1)
        : 4.8;

      return {
        ...MOCK_SALES_ANALYTICS,
        summary: {
          ...MOCK_SALES_ANALYTICS.summary,
          todayRevenue: todayRevenue > 0 ? todayRevenue : MOCK_SALES_ANALYTICS.summary.todayRevenue,
          ordersToday: todayOrders.length > 0 ? todayOrders.length : MOCK_SALES_ANALYTICS.summary.ordersToday,
          avgReviewScore: Number(avgReview),
        }
      };
    }
    throw err;
  }
}

/**
 * @function  getLoyaltyOverview
 * @summary   Fetches high-level loyalty programme statistics (Admin only)
 * @returns   {Promise<object>} Loyalty accounts summary dashboard
 * @throws    {object} Formatted error details
 */
export async function getLoyaltyOverview() {
  try {
    const res = await apiService.get('/admin/loyalty/overview');
    return res.data.overview;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: getLoyaltyOverview failed, returning mock overview');
      return {
        totalCustomersEnrolled: 148,
        activeTiers: {
          Dough: 82,
          Crust: 54,
          Legend: 12
        },
        pointsInCirculation: 12450,
        averagePointsPerCustomer: 84
      };
    }
    throw err;
  }
}

/**
 * @function  grantPoints
 * @summary   Manually adjusts a customer's loyalty balance (Admin only)
 * @param     {number} customerId - Customer identifier
 * @param     {number} points - Points count to add (or negative to subtract)
 * @param     {string} reason - Administrative note explaining adjustments
 * @returns   {Promise<object>} Status result indicating new balance
 * @throws    {object} Formatted error details
 */
export async function grantPoints(customerId, points, reason) {
  try {
    const res = await apiService.post(`/admin/loyalty/grant`, { customerId, points, reason });
    return res.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: grantPoints failed, modifying mock account`);
      
      const loyalty = JSON.parse(localStorage.getItem('mock_loyalty') || '{}');
      if (loyalty.customerId === Number(customerId)) {
        loyalty.pointsBalance = Math.max(0, (loyalty.pointsBalance || 0) + Number(points));
        localStorage.setItem('mock_loyalty', JSON.stringify(loyalty));
        
        const ledger = JSON.parse(localStorage.getItem('mock_loyalty_ledger') || '[]');
        ledger.unshift({
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          eventType: `Admin Grant: ${reason}`,
          pointsDelta: Number(points),
          balanceAfter: loyalty.pointsBalance
        });
        localStorage.setItem('mock_loyalty_ledger', JSON.stringify(ledger));
        
        return { success: true, pointsBalance: loyalty.pointsBalance };
      }
      
      throw { code: 'CUSTOMER_NOT_FOUND', message: 'Customer Rewards Account not found.' };
    }
    throw err;
  }
}

/**
 * @function  runEotwCalc
 * @summary   Triggers recalculation for Employee of the Week based on recent reviews
 * @returns   {Promise<object>} Details of the winning employee
 * @throws    {object} Formatted error details
 */
export async function runEotwCalc() {
  try {
    const res = await apiService.post('/admin/calc-eotw');
    return res.data.employee;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: runEotwCalc failed, returning mock calculation winner');
      const employees = JSON.parse(localStorage.getItem('mock_employees') || '[]');
      
      // Pick employee with the highest score
      const winner = [...employees].sort((a, b) => b.score - a.score)[0];
      return winner;
    }
    throw err;
  }
}

const adminService = {
  getSalesAnalytics,
  getLoyaltyOverview,
  grantPoints,
  runEotwCalc,
};

export default adminService;
