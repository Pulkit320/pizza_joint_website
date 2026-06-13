-- ============================================================
-- Migration:    V009__create_referrals.down.sql
-- Description:  Rolls back referrals table.
-- Affected:     referrals
-- Rollback:     <Up migration creates these tables>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TABLE IF EXISTS referrals CASCADE;
