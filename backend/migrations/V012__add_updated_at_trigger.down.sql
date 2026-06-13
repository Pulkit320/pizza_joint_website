-- ============================================================
-- Migration:    V012__add_updated_at_trigger.down.sql
-- Description:  Rolls back the updated_at trigger and trigger function.
-- Affected:     loyalty_accounts, FUNCTION set_updated_at()
-- Rollback:     <Up migration creates these trigger and function>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TRIGGER IF EXISTS trg_loyalty_accounts_updated_at ON loyalty_accounts;
DROP FUNCTION IF EXISTS set_updated_at();
