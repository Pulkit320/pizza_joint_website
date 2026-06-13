-- ============================================================
-- Migration:    V009__create_referrals.sql
-- Description:  Creates referrals table to track user-referred signups and bonus criteria.
-- Affected:     referrals
-- Rollback:     DROP TABLE IF EXISTS referrals CASCADE;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    referred_customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    referral_bonus_paid BOOLEAN DEFAULT false NOT NULL,
    bonus_paid_at TIMESTAMP WITH TIME ZONE,
    bonus_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT chk_no_self_referral CHECK (referrer_customer_id <> referred_customer_id),
    CONSTRAINT chk_referral_bonus_consistency CHECK (
        (referral_bonus_paid = true AND bonus_paid_at IS NOT NULL) OR 
        (referral_bonus_paid = false AND bonus_paid_at IS NULL AND bonus_order_id IS NULL)
    )
);

COMMENT ON TABLE referrals IS 'Tracks customer referrals and the resulting point bonuses earned upon first order';
COMMENT ON COLUMN referrals.id IS 'Primary key, unique identifier of the referral';
COMMENT ON COLUMN referrals.referrer_customer_id IS 'Foreign key referencing the customer who initiated the referral';
COMMENT ON COLUMN referrals.referred_customer_id IS 'Foreign key referencing the new customer who was referred; unique since a customer can only be referred once';
COMMENT ON COLUMN referrals.referral_bonus_paid IS 'Flag indicating if the referrer has received their referral bonus points';
COMMENT ON COLUMN referrals.bonus_paid_at IS 'Timestamp when the referral bonus was granted';
COMMENT ON COLUMN referrals.bonus_order_id IS 'Foreign key referencing the referred customer''s first order that triggered the bonus payment';
COMMENT ON COLUMN referrals.created_at IS 'Timestamp when the referral relation was registered';
