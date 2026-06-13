-- ============================================================
-- Migration:    V011__create_eotw_selections.sql
-- Description:  Stores the result of each Employee of the Week calculation run
-- Affected:     eotw_selections
-- Rollback:     DROP TABLE IF EXISTS eotw_selections;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE TABLE eotw_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- The Monday that starts the week this employee won for
  week_start_date DATE NOT NULL UNIQUE,

  -- Computed score components stored for auditability
  avg_service_rating NUMERIC(4,2),
  orders_processed_ratio NUMERIC(4,2),
  punctuality_score NUMERIC(4,2),
  final_weighted_score NUMERIC(6,4) NOT NULL,

  -- Whether the store average was substituted for rating (< 10 ratings)
  used_store_avg_for_rating BOOLEAN NOT NULL DEFAULT FALSE,

  -- Admin can override the auto-selected winner
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  overridden_by UUID REFERENCES employees(id) ON DELETE SET NULL,

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_eotw_selections_employee_id ON eotw_selections(employee_id);
CREATE INDEX IF NOT EXISTS idx_eotw_selections_overridden_by ON eotw_selections(overridden_by);

COMMENT ON TABLE eotw_selections IS
  'One row per week. Records the winning employee and the score breakdown used to select them.';

COMMENT ON COLUMN eotw_selections.id IS 'Primary key of the Employee of the Week selection (UUID)';
COMMENT ON COLUMN eotw_selections.employee_id IS 'Foreign key referencing the winning employee';
COMMENT ON COLUMN eotw_selections.week_start_date IS 'The Monday that starts the week this employee won for (must be unique)';
COMMENT ON COLUMN eotw_selections.avg_service_rating IS 'Average service rating of the employee during the evaluated week';
COMMENT ON COLUMN eotw_selections.orders_processed_ratio IS 'The ratio of orders processed by this employee versus the store total';
COMMENT ON COLUMN eotw_selections.punctuality_score IS 'Punctuality score computed for the employee';
COMMENT ON COLUMN eotw_selections.final_weighted_score IS 'The final computed weighted score used for selection';
COMMENT ON COLUMN eotw_selections.used_store_avg_for_rating IS 'True if store average rating was used as fallback (less than 10 ratings)';
COMMENT ON COLUMN eotw_selections.is_manual_override IS 'True if an administrator manually overrode the winner selection';
COMMENT ON COLUMN eotw_selections.override_reason IS 'Explanation of why the selection was manually overridden';
COMMENT ON COLUMN eotw_selections.overridden_by IS 'Admin employee ID who performed the manual override';
COMMENT ON COLUMN eotw_selections.calculated_at IS 'Timestamp when the calculation run was completed';
