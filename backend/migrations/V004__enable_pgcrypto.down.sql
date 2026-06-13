-- ============================================================
-- Migration:    V004__enable_pgcrypto.down.sql
-- Description:  Disables pgcrypto extension.
-- Affected:     Extensions (no tables)
-- Rollback:     <Up migration enables the extension>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP EXTENSION IF EXISTS "pgcrypto";
