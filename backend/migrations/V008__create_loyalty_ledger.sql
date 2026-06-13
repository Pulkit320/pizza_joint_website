-- ============================================================
-- Migration:    V008__create_loyalty_ledger.sql
-- Description:  Creates loyalty_ledger table and loyalty_event_type enum.
-- Affected:     loyalty_ledger, TYPE loyalty_event_type
-- Rollback:     DROP TABLE IF EXISTS loyalty_ledger CASCADE; DROP TYPE IF EXISTS loyalty_event_type CASCADE;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.loyalty_event_type AS ENUM (
        'order_earn',
        'bonus_earn',
        'referral_earn',
        'review_earn',
        'employee_rating_earn',
        'birthday_multiplier',
        'admin_grant',
        'redemption',
        'expiry'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS loyalty_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type public.loyalty_event_type NOT NULL,
    points_delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    note TEXT,
    issued_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT chk_admin_issued_by CHECK (
        (event_type = 'admin_grant'::public.loyalty_event_type AND issued_by IS NOT NULL) OR 
        (event_type <> 'admin_grant'::public.loyalty_event_type)
    ),
    CONSTRAINT chk_loyalty_ledger_note CHECK (
        (event_type = ANY(ARRAY['admin_grant'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type]) AND note IS NOT NULL AND TRIM(note) <> '') OR 
        (event_type <> ALL(ARRAY['admin_grant'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type]))
    ),
    CONSTRAINT chk_points_delta_sign CHECK (
        (event_type = ANY(ARRAY['redemption'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type]) AND points_delta < 0) OR 
        (event_type = ANY(ARRAY['order_earn'::public.loyalty_event_type, 'bonus_earn'::public.loyalty_event_type, 'referral_earn'::public.loyalty_event_type, 'review_earn'::public.loyalty_event_type, 'employee_rating_earn'::public.loyalty_event_type, 'birthday_multiplier'::public.loyalty_event_type]) AND points_delta > 0) OR 
        (event_type = 'admin_grant'::public.loyalty_event_type AND points_delta <> 0)
    )
);

COMMENT ON TABLE loyalty_ledger IS 'Immutable transaction log of all point earn and redemption events';
COMMENT ON COLUMN loyalty_ledger.id IS 'Primary key, unique identifier of this ledger transaction';
COMMENT ON COLUMN loyalty_ledger.customer_id IS 'Foreign key referencing the customer receiving or spending points';
COMMENT ON COLUMN loyalty_ledger.loyalty_account_id IS 'Foreign key referencing the associated loyalty account';
COMMENT ON COLUMN loyalty_ledger.order_id IS 'Foreign key referencing the order, null for admin grants and expirations';
COMMENT ON COLUMN loyalty_ledger.event_type IS 'The nature of the points event: earn, redemption, admin adjustment, or expiry';
COMMENT ON COLUMN loyalty_ledger.points_delta IS 'Positive for earn events, negative for redemption or expiry';
COMMENT ON COLUMN loyalty_ledger.balance_after IS 'Snapshot of the account balance immediately following this transaction';
COMMENT ON COLUMN loyalty_ledger.note IS 'Explanation of the change, mandatory for administrative adjustments and expirations';
COMMENT ON COLUMN loyalty_ledger.issued_by IS 'Foreign key referencing the employee who authorized an administrative grant';
COMMENT ON COLUMN loyalty_ledger.created_at IS 'Timestamp when the ledger entry was written';
