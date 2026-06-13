-- ============================================================
-- Migration:    V006__create_employee_ratings.sql
-- Description:  Creates employee_ratings table and employee_rating_tag enum.
-- Affected:     employee_ratings, TYPE employee_rating_tag
-- Rollback:     DROP TABLE IF EXISTS employee_ratings CASCADE; DROP TYPE IF EXISTS employee_rating_tag CASCADE;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.employee_rating_tag AS ENUM (
        'friendly',
        'fast',
        'professional',
        'went_above_and_beyond',
        'great_communicator'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS employee_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_score SMALLINT NOT NULL CHECK (service_score >= 1 AND service_score <= 5),
    written_note VARCHAR(200),
    tags public.employee_rating_tag[],
    is_excluded BOOLEAN DEFAULT false NOT NULL,
    excluded_reason TEXT,
    excluded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    excluded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT uq_employee_order_rating UNIQUE (employee_id, order_id, customer_id)
);

COMMENT ON TABLE employee_ratings IS 'Customer ratings for employees who served them on specific orders';
COMMENT ON COLUMN employee_ratings.id IS 'Primary key, unique identifier of the employee rating';
COMMENT ON COLUMN employee_ratings.employee_id IS 'Foreign key referencing the employee who is being rated';
COMMENT ON COLUMN employee_ratings.order_id IS 'Foreign key referencing the associated order';
COMMENT ON COLUMN employee_ratings.customer_id IS 'Foreign key referencing the customer who left the rating';
COMMENT ON COLUMN employee_ratings.service_score IS 'Customer rating of employee service, from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN employee_ratings.written_note IS 'Optional short note about the employee service, up to 200 characters';
COMMENT ON COLUMN employee_ratings.tags IS 'Array of employee rating tags detailing specific feedback';
COMMENT ON COLUMN employee_ratings.is_excluded IS 'Flag indicating if this rating is excluded from aggregate metrics (e.g. for spam/moderation)';
COMMENT ON COLUMN employee_ratings.excluded_reason IS 'The reason why this rating was excluded by administration';
COMMENT ON COLUMN employee_ratings.excluded_by IS 'Foreign key referencing the employee (admin) who excluded this rating';
COMMENT ON COLUMN employee_ratings.excluded_at IS 'Timestamp when this rating was marked as excluded';
COMMENT ON COLUMN employee_ratings.created_at IS 'Timestamp when the rating was submitted';
