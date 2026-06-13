-- ============================================================
-- Migration:    V007__create_loyalty_accounts.sql
-- Description:  Creates the loyalty_tier enum and loyalty_accounts table to manage customer loyalty points and membership tiers.
-- Affected:     loyalty_accounts, TYPE loyalty_tier
-- Rollback:     DROP TABLE IF EXISTS loyalty_accounts CASCADE; DROP TYPE IF EXISTS loyalty_tier CASCADE;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.loyalty_tier AS ENUM (
        'dough',
        'crust',
        'legend'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    current_balance INTEGER DEFAULT 0 NOT NULL CHECK (current_balance >= 0),
    lifetime_points_earned INTEGER DEFAULT 0 NOT NULL CHECK (lifetime_points_earned >= 0),
    current_tier public.loyalty_tier DEFAULT 'dough'::public.loyalty_tier NOT NULL,
    tier_anniversary_date DATE NOT NULL DEFAULT (NOW()::DATE + INTERVAL '1 year'),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expiry_warning_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE loyalty_accounts IS 'Accounts tracking customer loyalty points, balances, tiers, and anniversaries';
COMMENT ON COLUMN loyalty_accounts.id IS 'Primary key, unique identifier of the loyalty account';
COMMENT ON COLUMN loyalty_accounts.customer_id IS 'Foreign key referencing the customer; unique, indicating one loyalty account per customer';
COMMENT ON COLUMN loyalty_accounts.current_balance IS 'The customer''s current redeemable loyalty points balance';
COMMENT ON COLUMN loyalty_accounts.lifetime_points_earned IS 'Cumulative loyalty points earned over the lifetime of the account';
COMMENT ON COLUMN loyalty_accounts.current_tier IS 'The customer''s current loyalty tier: dough (basic), crust (intermediate), or legend (elite)';
COMMENT ON COLUMN loyalty_accounts.tier_anniversary_date IS 'Annual date when the customer''s tier status is re-evaluated based on past activity';
COMMENT ON COLUMN loyalty_accounts.last_activity_at IS 'Timestamp of the last loyalty activity, used to calculate point expiration due to inactivity';
COMMENT ON COLUMN loyalty_accounts.expiry_warning_sent_at IS 'Timestamp indicating when an email or notification warning about upcoming point expiry was sent';
COMMENT ON COLUMN loyalty_accounts.created_at IS 'Timestamp when the loyalty account was created';
COMMENT ON COLUMN loyalty_accounts.updated_at IS 'Timestamp when the loyalty account record was last modified';
