/**
 * @file        tier-check.js
 * @module      api/cron/tier-check
 * @description Vercel Cron handler for the daily tier sweep and token blacklist cleanup.
 *              Triggers at 2:00 AM daily.
 * @author      Deployment Agent
 * @version     1.0.0
 */

const loyaltyService = require('../../backend/src/services/loyaltyService');
const tokenBlacklist = require('../../backend/src/utils/tokenBlacklist');

module.exports = async (req, res) => {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    console.log('Starting daily tier anniversary check...');
    const tierResult = await loyaltyService.runTierDowngradesCheck();
    
    console.log('Starting token blacklist database cleanup...');
    const deletedCount = await tokenBlacklist.cleanup();

    return res.status(200).json({
      success: true,
      message: 'Daily cron tasks completed successfully.',
      data: {
        tierCheck: tierResult,
        blacklistCleanup: { deletedCount },
      },
    });
  } catch (error) {
    console.error('Error during daily cron tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Daily cron tasks failed.',
      error: error.message,
    });
  }
};
