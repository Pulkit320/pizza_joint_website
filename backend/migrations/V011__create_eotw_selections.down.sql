-- ============================================================
-- Migration:    V011__create_eotw_selections.down.sql
-- Description:  Rolls back the Employee of the Week calculation tracking table.
-- Affected:     eotw_selections
-- Rollback:     <Up migration creates these tables>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP INDEX IF EXISTS idx_eotw_selections_overridden_by;
DROP INDEX IF EXISTS idx_eotw_selections_employee_id;
DROP TABLE IF EXISTS eotw_selections CASCADE;
