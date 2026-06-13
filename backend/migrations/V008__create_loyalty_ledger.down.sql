-- ============================================================
-- Migration:    V008__create_loyalty_ledger.down.sql
-- Description:  Rolls back loyalty_ledger table and loyalty_event_type enum.
-- Affected:     loyalty_ledger, TYPE loyalty_event_type
-- Rollback:     <Up migration creates these objects>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TABLE IF EXISTS loyalty_ledger CASCADE;
DROP TYPE IF EXISTS public.loyalty_event_type CASCADE;
