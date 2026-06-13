-- ============================================================
-- Migration:    V013__create_token_blacklist.down.sql
-- Description:  Rolls back the token_blacklist table by dropping it
-- Affected:     token_blacklist
-- Rollback:     V013__create_token_blacklist.sql
-- Author:       Deployment Agent
-- Version:      1.0.0
-- ============================================================

DROP TABLE IF EXISTS token_blacklist CASCADE;
