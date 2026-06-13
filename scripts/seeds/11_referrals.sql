-- 11_referrals.sql

INSERT INTO public.referrals (id, referrer_customer_id, referred_customer_id, referral_bonus_paid, bonus_paid_at, bonus_order_id, created_at) VALUES
-- Rajesh Kumar refers Aarav Mehta (Paid because Aarav placed Order 3)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', true, MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1), 'b0000000-0000-0000-0000-000000000003', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1) - INTERVAL '5 days'),

-- Aarav Mehta refers Vikram Singh (Unpaid referral)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', false, NULL, NULL, CURRENT_DATE - INTERVAL '3 months' - INTERVAL '5 days'),

-- Aditi Rao refers Kavita Patel (Unpaid referral)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', false, NULL, NULL, CURRENT_DATE - INTERVAL '2 months' - INTERVAL '5 days');
