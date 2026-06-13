-- ============================================================
-- Migration:    V010__create_indexes.sql
-- Description:  Creates database indexes for new foreign keys and search columns.
-- Affected:     customers, employee_ratings, loyalty_ledger, order_item_ratings, order_reviews, orders, referrals
-- Rollback:     See companion down migration script
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by);
CREATE INDEX IF NOT EXISTS idx_employee_ratings_customer_id ON employee_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_employee_ratings_employee_id ON employee_ratings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_ratings_excluded_by ON employee_ratings(excluded_by);
CREATE INDEX IF NOT EXISTS idx_employee_ratings_order_id ON employee_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_customer_id ON loyalty_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_issued_by ON loyalty_ledger(issued_by);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_loyalty_account_id ON loyalty_ledger(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_order_id ON loyalty_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_ratings_order_item_id ON order_item_ratings(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_ratings_product_id ON order_item_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_ratings_review_id ON order_item_ratings(review_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_customer_id ON order_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_server_employee_id ON orders(server_employee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_bonus_order_id ON referrals(bonus_order_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_customer_id ON referrals(referrer_customer_id);
