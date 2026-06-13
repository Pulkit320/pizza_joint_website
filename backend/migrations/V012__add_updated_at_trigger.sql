-- ============================================================
-- Migration:    V012__add_updated_at_trigger.sql
-- Description:  Creates a reusable trigger function that sets 
--               updated_at = NOW() on any row update, and applies 
--               it to loyalty_accounts
-- Affected:     loyalty_accounts
-- Rollback:     See .down.sql
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_loyalty_accounts_updated_at
  BEFORE UPDATE ON loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
