-- ============================================================
-- Migration:    V004__enable_pgcrypto.sql
-- Description:  Enables pgcrypto extension for gen_random_uuid() 
--               support on PostgreSQL < 13
-- Affected:     Extensions (no tables)
-- Rollback:     DROP EXTENSION IF EXISTS "pgcrypto";
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
