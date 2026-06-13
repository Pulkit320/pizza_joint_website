-- ============================================================
-- Migration:    V006__create_employee_ratings.down.sql
-- Description:  Rolls back employee_ratings table and employee_rating_tag enum.
-- Affected:     employee_ratings, TYPE employee_rating_tag
-- Rollback:     <Up migration creates these objects>
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DROP TABLE IF EXISTS employee_ratings;
DROP TYPE IF EXISTS public.employee_rating_tag;
