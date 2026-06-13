-- ============================================================
-- Migration:    V005__create_order_reviews.down.sql
-- Description:  Rolls back order_reviews and order_item_ratings tables.
-- Affected:     order_reviews, order_item_ratings
-- Rollback:     <Up migration creates these tables>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TABLE IF EXISTS order_item_ratings CASCADE;
DROP TABLE IF EXISTS order_reviews CASCADE;
