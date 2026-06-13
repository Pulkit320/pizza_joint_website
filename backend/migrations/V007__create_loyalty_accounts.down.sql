-- ============================================================
-- Migration:    V007__create_loyalty_accounts.down.sql
-- Description:  Rolls back loyalty_accounts table and loyalty_tier enum.
-- Affected:     loyalty_accounts, TYPE loyalty_tier
-- Rollback:     <Up migration creates these objects>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TABLE IF EXISTS loyalty_accounts CASCADE;
DROP TYPE IF EXISTS public.loyalty_tier CASCADE;
