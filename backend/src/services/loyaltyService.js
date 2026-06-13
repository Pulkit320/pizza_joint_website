/**
 * @file        loyaltyService.js
 * @module      LoyaltyService
 * @description Service layer managing loyalty point transactions, tier evaluations, referrals, and expirations.
 * @layer       service
 * @author      Antigravity
 * @version     1.0.0
 */

const loyaltyModel = require('../models/loyaltyModel');
const authModel = require('../models/authModel');
const { pool } = require('../config/db');
const ErrorCodes = require('../utils/errorCodes');

class LoyaltyService {
  /**
   * @function  _mapLoyaltyAccount
   * @summary   Maps raw database loyalty account columns to camelCase API structure
   * @param     {object}  account  - Database loyalty account record
   * @returns   {object|null} Mapped camelCase object
   * @private
   */
  _mapLoyaltyAccount(account) {
    if (!account) return null;
    return {
      id: account.id,
      customerId: account.customer_id,
      currentBalance: account.current_balance,
      lifetimePointsEarned: account.lifetime_points_earned,
      currentTier: account.current_tier,
      tierAnniversaryDate: account.tier_anniversary_date,
      lastActivityAt: account.last_activity_at,
    };
  }

  /**
   * @function  earnPoints
   * @summary   Credits loyalty points to a customer account and evaluates tier progression
   * @param     {object}  earnData            - Details of the points to earn
   * @param     {string}  earnData.customerId - Customer ID (UUID)
   * @param     {number}  earnData.pointsDelta - Quantity of points to credit (positive)
   * @param     {string}  earnData.eventType  - Loyalty event type enum
   * @param     {string}  [earnData.orderId]  - Associated order ID
   * @param     {string}  [earnData.note]     - Transaction description note
   * @param     {string}  [earnData.issuedBy] - Authorized employee ID for admin grants
   * @param     {object}  [client]            - Transaction client
   * @returns   {Promise<object>} The updated loyalty account record
   */
  async earnPoints(earnData, client) {
    const { customerId, pointsDelta, eventType, orderId, note, issuedBy } = earnData;

    if (pointsDelta <= 0 && eventType !== 'admin_grant') {
      throw new Error('Points delta must be positive to earn points.');
    }

    let localClient = client;
    let ownTransaction = false;

    if (!localClient) {
      localClient = await pool.connect();
      await localClient.query('BEGIN');
      ownTransaction = true;
    }

    try {
      // 1. Lock loyalty account for update
      const account = await loyaltyModel.findAccountByCustomerIdForUpdate(customerId, localClient);
      if (!account) {
        const error = new Error('Loyalty account not found.');
        error.statusCode = 404;
        error.code = ErrorCodes.NOT_FOUND;
        throw error;
      }

      // 2. Adjust balances (admin grant pointsDelta can be negative)
      const prevBalance = account.current_balance;
      const prevLifetime = account.lifetime_points_earned;

      let newBalance = prevBalance + pointsDelta;
      if (newBalance < 0) {
        newBalance = 0; // prevent negative balance
      }
      
      let newLifetime = prevLifetime;
      if (pointsDelta > 0) {
        newLifetime += pointsDelta;
      }

      // 3. Immediately evaluate tier upgrades based on new lifetime points
      let newTier = account.current_tier;
      if (newLifetime >= 2000) {
        newTier = 'legend';
      } else if (newLifetime >= 500) {
        newTier = 'crust';
      } else {
        newTier = 'dough';
      }

      let anniversaryDate = account.tier_anniversary_date;
      const tierHierarchy = { dough: 1, crust: 2, legend: 3 };
      
      // If upgraded, extend anniversary date to 1 year from today
      if (tierHierarchy[newTier] > tierHierarchy[account.current_tier]) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        anniversaryDate = d.toISOString().split('T')[0];
      }

      // 4. Update the account in DB
      const updatedAccount = await loyaltyModel.updateLoyaltyAccount({
        id: account.id,
        currentBalance: newBalance,
        lifetimePointsEarned: newLifetime,
        currentTier: newTier,
        tierAnniversaryDate: anniversaryDate,
      }, localClient);

      // 5. Log entry in the ledger
      await loyaltyModel.createLedgerEntry({
        customerId,
        loyaltyAccountId: account.id,
        orderId,
        eventType,
        pointsDelta,
        balanceAfter: newBalance,
        note,
        issuedBy,
      }, localClient);

      if (ownTransaction) {
        await localClient.query('COMMIT');
      }

      return this._mapLoyaltyAccount(updatedAccount);
    } catch (err) {
      if (ownTransaction) {
        await localClient.query('ROLLBACK');
      }
      throw err;
    } finally {
      if (ownTransaction) {
        localClient.release();
      }
    }
  }

  /**
   * @function  earnPointsForOrder
   * @summary   Processes and calculates loyalty points when an order is completed
   * @param     {string}  customerId  - Customer ID
   * @param     {string}  orderId     - Order ID
   * @param     {number}  orderAmount - Order total value (Rupees)
   * @returns   {Promise<void>}
   */
  async earnPointsForOrder(customerId, orderId, orderAmount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get loyalty account (locked)
      const account = await loyaltyModel.findAccountByCustomerIdForUpdate(customerId, client);
      if (!account) {
        throw new Error('Loyalty account not found.');
      }

      // 2. Fetch customer details
      const customer = await authModel.findCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found.');
      }

      // 3. Compute base points
      const basePointsPerRupee = parseFloat(process.env.LOYALTY_POINTS_PER_RUPEE || '0.1');
      let basePoints = Math.round(orderAmount * basePointsPerRupee);

      // 4. Apply tier multiplier (crust = 1.25x, legend = 1.5x)
      let tierMultiplier = 1.0;
      if (account.current_tier === 'crust') {
        tierMultiplier = 1.25;
      } else if (account.current_tier === 'legend') {
        tierMultiplier = 1.5;
      }
      const tierPoints = Math.round(basePoints * tierMultiplier);

      // 5. Credit order earn points
      await this.earnPoints({
        customerId,
        pointsDelta: tierPoints,
        eventType: 'order_earn',
        orderId,
        note: `Points earned for order of amount ${orderAmount} (Tier multiplier: ${tierMultiplier}x)`,
      }, client);

      // 6. Check birthday multiplier (2x in birth month)
      if (customer.date_of_birth) {
        const dob = new Date(customer.date_of_birth);
        const today = new Date();
        if (dob.getMonth() === today.getMonth()) {
          // Double points: credit extra points equivalent to base order earn
          await this.earnPoints({
            customerId,
            pointsDelta: tierPoints,
            eventType: 'birthday_multiplier',
            orderId,
            note: `2x Birthday month bonus points applied`,
          }, client);
        }
      }

      // 7. Check if this is their first order to grant first order bonus (100 pts)
      const orderEarnCount = await loyaltyModel.countOrderEarnEvents(customerId, client);
      // Since we just ran one order_earn above, count will be 1 if this was their first
      if (orderEarnCount === 1) {
        await this.earnPoints({
          customerId,
          pointsDelta: 100,
          eventType: 'bonus_earn',
          orderId,
          note: 'First order reward bonus points',
        }, client);

        // Also check if customer was referred to reward the referrer (200 pts)
        const referralSql = 'SELECT * FROM referrals WHERE referred_customer_id = $1 AND referral_bonus_paid = false';
        const refRes = await client.query(referralSql, [customerId]);
        if (refRes.rows[0]) {
          const referral = refRes.rows[0];
          // Reward referrer
          await this.earnPoints({
            customerId: referral.referrer_customer_id,
            pointsDelta: 200,
            eventType: 'referral_earn',
            orderId,
            note: `Referral bonus for referring customer ${customerId}`,
          }, client);

          // Update referral status to paid
          const updateRefSql = `
            UPDATE referrals
            SET referral_bonus_paid = true, bonus_paid_at = now(), bonus_order_id = $1
            WHERE id = $2;
          `;
          await client.query(updateRefSql, [orderId, referral.id]);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to process loyalty earnings for order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * @function  redeemPoints
   * @summary   Enforces eligibility bounds and redeems loyalty points at checkout
   * @param     {string}  customerId     - Customer ID
   * @param     {number}  pointsToRedeem  - Quantity of points to spend
   * @param     {string}  orderId        - Order ID
   * @returns   {Promise<object>} The updated loyalty account details
   */
  async redeemPoints(customerId, pointsToRedeem, orderId) {
    if (pointsToRedeem < 100) {
      const error = new Error('Minimum of 100 points is required for redemption.');
      error.statusCode = 400;
      error.code = ErrorCodes.INVALID_REDEMPTION;
      throw error;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock loyalty account
      const account = await loyaltyModel.findAccountByCustomerIdForUpdate(customerId, client);
      if (!account) {
        const error = new Error('Loyalty account not found.');
        error.statusCode = 404;
        error.code = ErrorCodes.NOT_FOUND;
        throw error;
      }

      // Verify sufficient points
      if (account.current_balance < pointsToRedeem) {
        const error = new Error(`Insufficient points balance. Current: ${account.current_balance}`);
        error.statusCode = 400;
        error.code = ErrorCodes.INSUFFICIENT_POINTS;
        throw error;
      }

      // 2. Fetch order total amount to verify 50% limit
      const orderSql = 'SELECT total_amount FROM orders WHERE id = $1 FOR UPDATE';
      const orderRes = await client.query(orderSql, [orderId]);
      if (!orderRes.rows[0]) {
        const error = new Error('Order not found.');
        error.statusCode = 404;
        error.code = ErrorCodes.NOT_FOUND;
        throw error;
      }

      const orderAmount = parseFloat(orderRes.rows[0].total_amount);
      const redemptionRate = parseFloat(process.env.LOYALTY_REDEMPTION_RATE || '10');
      
      // Calculate discount amount in Rupees
      const discountAmount = pointsToRedeem / redemptionRate;
      const maxDiscount = orderAmount * 0.5;

      if (discountAmount > maxDiscount) {
        const error = new Error(`Redemption exceeds 50% of the order total. Max discount allowed: ₹${maxDiscount}`);
        error.statusCode = 400;
        error.code = ErrorCodes.INVALID_REDEMPTION;
        throw error;
      }

      // 3. Deduct balance in loyalty account
      const newBalance = account.current_balance - pointsToRedeem;
      const updatedAccount = await loyaltyModel.updateLoyaltyAccount({
        id: account.id,
        currentBalance: newBalance,
        lifetimePointsEarned: account.lifetime_points_earned,
        currentTier: account.current_tier,
        tierAnniversaryDate: account.tier_anniversary_date,
      }, client);

      // 4. Log redemption transaction in ledger (pointsDelta MUST be negative)
      await loyaltyModel.createLedgerEntry({
        customerId,
        loyaltyAccountId: account.id,
        orderId,
        eventType: 'redemption',
        pointsDelta: -pointsToRedeem,
        balanceAfter: newBalance,
        note: `Redeemed points at checkout for ₹${discountAmount} discount`,
      }, client);

      // 5. Update order total amount
      const newOrderTotal = orderAmount - discountAmount;
      const updateOrderSql = 'UPDATE orders SET total_amount = $1, updated_at = now() WHERE id = $2';
      await client.query(updateOrderSql, [newOrderTotal, orderId]);

      await client.query('COMMIT');
      return this._mapLoyaltyAccount(updatedAccount);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * @function  getCustomerLoyalty
   * @summary   Retrieves customer loyalty account details
   * @param     {string}  customerId - Customer ID
   * @returns   {Promise<object>} Account details with progress metrics
   */
  async getCustomerLoyalty(customerId) {
    const account = await loyaltyModel.findAccountByCustomerId(customerId);
    if (!account) {
      const error = new Error('Loyalty account not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // Compute progress
    let pointsNeeded = 0;
    let nextTier = 'legend';
    const lifetime = account.lifetime_points_earned;

    if (account.current_tier === 'dough') {
      pointsNeeded = Math.max(0, 500 - lifetime);
      nextTier = 'crust';
    } else if (account.current_tier === 'crust') {
      pointsNeeded = Math.max(0, 2000 - lifetime);
      nextTier = 'legend';
    } else {
      pointsNeeded = 0;
      nextTier = 'legend'; // Maxed out
    }

    return {
      id: account.id,
      customerId: account.customer_id,
      currentBalance: account.current_balance,
      lifetimePointsEarned: account.lifetime_points_earned,
      currentTier: account.current_tier,
      tierAnniversaryDate: account.tier_anniversary_date,
      lastActivityAt: account.last_activity_at,
      progress: {
        nextTier,
        pointsNeeded,
      },
    };
  }

  /**
   * @function  getLedgerHistory
   * @summary   Retrieves paginated ledger transactions for a customer
   * @param     {string}  customerId - Customer ID
   * @param     {number}  page       - Page number
   * @param     {number}  limit      - Max entries per page
   * @returns   {Promise<object>} Paginated results
   */
  async getLedgerHistory(customerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const total = await loyaltyModel.countLedgerEntries(customerId);
    const rows = await loyaltyModel.findLedgerEntriesPaginated(customerId, limit, offset);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      entries: rows,
    };
  }

  /**
   * @function  runTierDowngradesCheck
   * @summary   Evaluates and performs daily tier downgrades and points inactivity expiration checks
   * @returns   {Promise<object>} Status of evaluated and modified records
   */
  async runTierDowngradesCheck() {
    const client = await pool.connect();
    let accountsDowngradedCount = 0;
    let accountsExpiredCount = 0;

    try {
      await client.query('BEGIN');

      // Part 1: Tier Re-evaluation (Anniversaries)
      const dueAccounts = await loyaltyModel.findAnniversaryAccounts();
      for (const account of dueAccounts) {
        // Calculate points earned in past year
        const ptsPastYear = await loyaltyModel.getPointsEarnedInPastYear(account.customer_id, client);
        
        let targetTier = 'dough';
        if (ptsPastYear >= 2000) {
          targetTier = 'legend';
        } else if (ptsPastYear >= 500) {
          targetTier = 'crust';
        }

        const tierHierarchy = { dough: 1, crust: 2, legend: 3 };
        const nextAnniversaryDate = new Date();
        nextAnniversaryDate.setFullYear(nextAnniversaryDate.getFullYear() + 1);
        const anniversaryStr = nextAnniversaryDate.toISOString().split('T')[0];

        // Update to new tier and shift anniversary date
        await loyaltyModel.updateLoyaltyAccount({
          id: account.id,
          currentBalance: account.current_balance,
          lifetimePointsEarned: account.lifetime_points_earned,
          currentTier: targetTier,
          tierAnniversaryDate: anniversaryStr,
        }, client);

        if (tierHierarchy[targetTier] < tierHierarchy[account.current_tier]) {
          accountsDowngradedCount++;
          // Optional: log a system audit ledger entry for downgrade
          await loyaltyModel.createLedgerEntry({
            customerId: account.customer_id,
            loyaltyAccountId: account.id,
            eventType: 'admin_grant',
            pointsDelta: 0,
            balanceAfter: account.current_balance,
            note: `System tier downgrade re-evaluation from ${account.current_tier} to ${targetTier} on anniversary`,
          }, client);
        }
      }

      // Part 2: Points Expiry due to Inactivity (last_activity_at)
      const expiryMonths = parseInt(process.env.LOYALTY_EXPIRY_MONTHS || '12', 10);
      const expiryIntervalStr = `${expiryMonths} months`;
      
      const selectExpiredSql = `
        SELECT * FROM loyalty_accounts
        WHERE last_activity_at <= NOW() - INTERVAL '${expiryIntervalStr}' AND current_balance > 0;
      `;
      const expiredAccounts = (await client.query(selectExpiredSql)).rows;

      for (const account of expiredAccounts) {
        const oldBalance = account.current_balance;

        // Reset balance to 0
        await loyaltyModel.updateLoyaltyAccount({
          id: account.id,
          currentBalance: 0,
          lifetimePointsEarned: account.lifetime_points_earned,
          currentTier: account.current_tier,
          tierAnniversaryDate: account.tier_anniversary_date,
        }, client);

        // Record expiry in ledger
        await loyaltyModel.createLedgerEntry({
          customerId: account.customer_id,
          loyaltyAccountId: account.id,
          eventType: 'expiry',
          pointsDelta: -oldBalance,
          balanceAfter: 0,
          note: `Points expired due to inactivity for ${expiryMonths} months`,
        }, client);

        accountsExpiredCount++;
      }

      await client.query('COMMIT');
      return {
        success: true,
        tierAnniversariesEvaluated: dueAccounts.length,
        accountsDowngraded: accountsDowngradedCount,
        accountsExpired: accountsExpiredCount,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to complete tier downgrade check:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * @function  getAdminOverview
   * @summary   Aggregates global loyalty program stats
   * @returns   {Promise<object>} Statistical overview
   */
  async getAdminOverview() {
    return await loyaltyModel.getAdminOverviewStats();
  }

  /**
   * @function  adminGrantPoints
   * @summary   Authorizes administrative point adjustments
   * @param     {object}  grantData            - Adjustment details
   * @param     {string}  adminId              - Admin ID authorizing the action
   * @returns   {Promise<object>} The updated loyalty account
   */
  async adminGrantPoints(grantData, adminId) {
    const { customerId, pointsDelta, note } = grantData;

    if (!note || note.trim() === '') {
      const error = new Error('Admin grant note is mandatory.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    if (pointsDelta === 0) {
      const error = new Error('Points delta cannot be zero.');
      error.statusCode = 400;
      error.code = ErrorCodes.BAD_REQUEST;
      throw error;
    }

    return await this.earnPoints({
      customerId,
      pointsDelta,
      eventType: 'admin_grant',
      note,
      issuedBy: adminId,
    });
  }

  /**
   * @function  getCustomerLedgerAdmin
   * @summary   Retrieves complete (or paginated) points log for administrative review
   * @param     {string}  customerId - Customer ID
   * @returns   {Promise<Array>} Complete ledger log
   */
  async getCustomerLedgerAdmin(customerId) {
    const account = await loyaltyModel.findAccountByCustomerId(customerId);
    if (!account) {
      const error = new Error('Customer loyalty account not found.');
      error.statusCode = 404;
      error.code = ErrorCodes.NOT_FOUND;
      throw error;
    }

    // Get up to 1000 entries for admin inspection
    const results = await loyaltyModel.findLedgerEntriesPaginated(customerId, 1000, 0);
    return results;
  }
}

module.exports = new LoyaltyService();
