-- ============================================================
-- Migration:    V010__create_indexes.down.sql
-- Description:  Rolls back database indexes.
-- Affected:     customers, employee_ratings, loyalty_ledger, order_item_ratings, order_reviews, orders, referrals
-- Rollback:     <Up migration creates these indexes>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP INDEX IF EXISTS idx_customers_referred_by;
DROP INDEX IF EXISTS idx_employee_ratings_customer_id;
DROP INDEX IF EXISTS idx_employee_ratings_employee_id;
DROP INDEX IF EXISTS idx_employee_ratings_excluded_by;
DROP INDEX IF EXISTS idx_employee_ratings_order_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_customer_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_issued_by;
DROP INDEX IF EXISTS idx_loyalty_ledger_loyalty_account_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_order_id;
DROP INDEX IF EXISTS idx_order_item_ratings_order_item_id;
DROP INDEX IF EXISTS idx_order_item_ratings_product_id;
DROP INDEX IF EXISTS idx_order_item_ratings_review_id;
DROP INDEX IF EXISTS idx_order_reviews_customer_id;
DROP INDEX IF EXISTS idx_order_reviews_order_id;
DROP INDEX IF EXISTS idx_orders_server_employee_id;
DROP INDEX IF EXISTS idx_referrals_bonus_order_id;
DROP INDEX IF EXISTS idx_referrals_referrer_customer_id;
