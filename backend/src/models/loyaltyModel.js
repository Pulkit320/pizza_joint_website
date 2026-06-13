/**
 * @file        loyaltyModel.js
 * @module      LoyaltyModel
 * @description Direct SQL model operations for loyalty accounts and ledger tracking.
 * @layer       model
 * @author      Antigravity
 * @version     1.0.0
 */

const { executeQuery } = require('../config/db');

/**
 * @function  findAccountByCustomerId
 * @summary   Queries the loyalty account for a customer
 * @param     {string}  customerId - Customer unique ID (UUID)
 * @param     {object}  [client]   - Optional transaction client
 * @returns   {Promise<object|null>} The loyalty account record or null
 */
async function findAccountByCustomerId(customerId, client) {
  const sqlText = 'SELECT * FROM loyalty_accounts WHERE customer_id = $1';
  const params = [customerId];
  const result = client 
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
  return result.rows[0] || null;
}

/**
 * @function  findAccountByCustomerIdForUpdate
 * @summary   Queries and locks the loyalty account for update inside a transaction
 * @param     {string}  customerId - Customer unique ID (UUID)
 * @param     {object}  client     - Transaction client
 * @returns   {Promise<object|null>} The locked loyalty account record or null
 */
async function findAccountByCustomerIdForUpdate(customerId, client) {
  const sqlText = 'SELECT * FROM loyalty_accounts WHERE customer_id = $1 FOR UPDATE';
  const result = await client.query(sqlText, [customerId]);
  return result.rows[0] || null;
}

/**
 * @function  updateLoyaltyAccount
 * @summary   Updates loyalty account balance, tier, and lifetime stats
 * @param     {object}  accountData  - Loyalty account update data
 * @param     {object}  client       - Transaction client
 * @returns   {Promise<object>} The updated loyalty account record
 */
async function updateLoyaltyAccount(accountData, client) {
  const { id, currentBalance, lifetimePointsEarned, currentTier, tierAnniversaryDate } = accountData;
  const sqlText = `
    UPDATE loyalty_accounts
    SET current_balance = $1, 
        lifetime_points_earned = $2, 
        current_tier = $3, 
        tier_anniversary_date = $4,
        last_activity_at = now(),
        updated_at = now()
    WHERE id = $5
    RETURNING *;
  `;
  const params = [currentBalance, lifetimePointsEarned, currentTier, tierAnniversaryDate, id];
  const result = await client.query(sqlText, params);
  return result.rows[0];
}

/**
 * @function  createLedgerEntry
 * @summary   Inserts a new transaction log entry in the loyalty ledger
 * @param     {object}  ledgerData - Transaction details
 * @param     {object}  client     - Transaction client
 * @returns   {Promise<object>} The created ledger record
 */
async function createLedgerEntry(ledgerData, client) {
  const { customerId, loyaltyAccountId, orderId, eventType, pointsDelta, balanceAfter, note, issuedBy } = ledgerData;
  const sqlText = `
    INSERT INTO loyalty_ledger (customer_id, loyalty_account_id, order_id, event_type, points_delta, balance_after, note, issued_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const params = [customerId, loyaltyAccountId, orderId || null, eventType, pointsDelta, balanceAfter, note || null, issuedBy || null];
  const result = await client.query(sqlText, params);
  return result.rows[0];
}

/**
 * @function  findLedgerEntriesPaginated
 * @summary   Retrieves a paginated list of ledger entries for a customer
 * @param     {string}  customerId - Customer ID
 * @param     {number}  limit      - Max number of items to return
 * @param     {number}  offset     - Number of items to skip
 * @returns   {Promise<Array>} List of ledger records
 */
async function findLedgerEntriesPaginated(customerId, limit, offset) {
  const sqlText = `
    SELECT * FROM loyalty_ledger
    WHERE customer_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await executeQuery(sqlText, [customerId, limit, offset]);
  return result.rows;
}

/**
 * @function  countLedgerEntries
 * @summary   Gets the total count of ledger entries for a customer
 * @param     {string}  customerId - Customer ID
 * @returns   {Promise<number>} Total count
 */
async function countLedgerEntries(customerId) {
  const sqlText = 'SELECT COUNT(*) FROM loyalty_ledger WHERE customer_id = $1';
  const result = await executeQuery(sqlText, [customerId]);
  return parseInt(result.rows[0].count, 10);
}

/**
 * @function  countOrderEarnEvents
 * @summary   Counts the number of order earn events to verify first order bonus eligibility
 * @param     {string}  customerId - Customer ID
 * @param     {object}  [client]   - Optional transaction client
 * @returns   {Promise<number>} Number of order earn events
 */
async function countOrderEarnEvents(customerId, client) {
  const sqlText = "SELECT COUNT(*) FROM loyalty_ledger WHERE customer_id = $1 AND event_type = 'order_earn'";
  const params = [customerId];
  const result = client
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * @function  getAdminOverviewStats
 * @summary   Retrieves global summary metrics of the loyalty program
 * @returns   {Promise<object>} Statistics object
 */
async function getAdminOverviewStats() {
  const membersSql = 'SELECT COUNT(*) FROM loyalty_accounts;';
  const activePtsSql = 'SELECT COALESCE(SUM(current_balance), 0) AS total FROM loyalty_accounts;';
  const earnedPtsSql = 'SELECT COALESCE(SUM(lifetime_points_earned), 0) AS total FROM loyalty_accounts;';
  const tierSql = 'SELECT current_tier, COUNT(*) FROM loyalty_accounts GROUP BY current_tier;';
  const redeemedSql = "SELECT COALESCE(ABS(SUM(points_delta)), 0) AS total FROM loyalty_ledger WHERE event_type = 'redemption';";

  const membersRes = await executeQuery(membersSql);
  const activeRes = await executeQuery(activePtsSql);
  const earnedRes = await executeQuery(earnedPtsSql);
  const tierRes = await executeQuery(tierSql);
  const redeemedRes = await executeQuery(redeemedSql);

  const tiers = { dough: 0, crust: 0, legend: 0 };
  tierRes.rows.forEach(r => {
    tiers[r.current_tier] = parseInt(r.count, 10);
  });

  return {
    totalMembers: parseInt(membersRes.rows[0].count, 10),
    totalPointsActive: parseInt(activeRes.rows[0].total, 10),
    totalPointsEarned: parseInt(earnedRes.rows[0].total, 10),
    totalPointsRedeemed: parseInt(redeemedRes.rows[0].total, 10),
    tierDistribution: tiers,
  };
}

/**
 * @function  findAnniversaryAccounts
 * @summary   Retrieves all accounts due for annual tier anniversary check
 * @returns   {Promise<Array>} List of loyalty account records
 */
async function findAnniversaryAccounts() {
  const sqlText = 'SELECT * FROM loyalty_accounts WHERE tier_anniversary_date <= CURRENT_DATE;';
  const result = await executeQuery(sqlText);
  return result.rows;
}

/**
 * @function  getPointsEarnedInPastYear
 * @summary   Calculates total positive points earned by a customer in the last 12 months
 * @param     {string}  customerId - Customer ID
 * @param     {object}  [client]   - Optional transaction client
 * @returns   {Promise<number>} Total points earned in past year
 */
async function getPointsEarnedInPastYear(customerId, client) {
  const sqlText = `
    SELECT COALESCE(SUM(points_delta), 0) AS total 
    FROM loyalty_ledger 
    WHERE customer_id = $1 
      AND points_delta > 0 
      AND created_at >= NOW() - INTERVAL '1 year';
  `;
  const params = [customerId];
  const result = client
    ? await client.query(sqlText, params)
    : await executeQuery(sqlText, params);
  return parseInt(result.rows[0].total, 10);
}

module.exports = {
  findAccountByCustomerId,
  findAccountByCustomerIdForUpdate,
  updateLoyaltyAccount,
  createLedgerEntry,
  findLedgerEntriesPaginated,
  countLedgerEntries,
  countOrderEarnEvents,
  getAdminOverviewStats,
  findAnniversaryAccounts,
  getPointsEarnedInPastYear,
};
