/**
 * @file        employee-of-week.js
 * @module      api/cron/employee-of-week
 * @description Vercel Cron handler for the weekly Employee of the Week calculation.
 *              Triggers at 3:00 AM on Mondays.
 * @author      Deployment Agent
 * @version     1.0.0
 */

const eotwService = require('../../backend/src/services/eotwService');

module.exports = async (req, res) => {
  // Verify authorization
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting weekly Employee of the Week calculation...');
    const winner = await eotwService.calculateWeeklyEotw();

    return res.status(200).json({
      success: true,
      message: 'Weekly Employee of the Week calculation completed successfully.',
      data: winner,
    });
  } catch (error) {
    console.error('Error during weekly EOTW calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Weekly EOTW calculation failed.',
      error: error.message,
    });
  }
};
