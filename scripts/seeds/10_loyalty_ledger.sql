-- 10_loyalty_ledger.sql

INSERT INTO public.loyalty_ledger (id, customer_id, loyalty_account_id, order_id, event_type, points_delta, balance_after, note, created_at) VALUES
-- Rajesh Kumar (Legend)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'order_earn', 1200, 1200, 'Points earned for order of amount 12000 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '5 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'bonus_earn', 100, 1300, 'First order reward bonus points', CURRENT_DATE - INTERVAL '5 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'review_earn', 10, 1310, 'Review submitted for order b0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'order_earn', 1000, 2310, 'Points earned for order of amount 8000 (Tier multiplier: 1.25x)', CURRENT_DATE - INTERVAL '4 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000015', 'employee_rating_earn', 5, 2315, 'Rated employee a1000000-0000-0000-0000-000000000002 for order b0000000-0000-0000-0000-000000000015', CURRENT_DATE - INTERVAL '2 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'referral_earn', 200, 2515, 'Referral bonus for referring customer c1000000-0000-0000-0000-000000000002', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),

-- Aarav Mehta (Dough)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'order_earn', 150, 150, 'Points earned for order of amount 1500 (Tier multiplier: 1.0x)', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'bonus_earn', 100, 250, 'First order reward bonus points', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'birthday_multiplier', 150, 400, '2x Birthday month bonus points applied', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'review_earn', 10, 410, 'Review submitted for order b0000000-0000-0000-0000-000000000003', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'employee_rating_earn', 5, 415, 'Rated employee a1000000-0000-0000-0000-000000000003 for order b0000000-0000-0000-0000-000000000003', MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1)),

-- Vikram Singh
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'order_earn', 90, 90, 'Points earned for order of amount 900 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '3 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'bonus_earn', 100, 190, 'First order reward bonus points', CURRENT_DATE - INTERVAL '3 months'),

-- Aditi Rao (Crust & Redemption)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'order_earn', 200, 200, 'Points earned for order of amount 2000 (Tier multiplier: 1.0x)', CURRENT_DATE),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'bonus_earn', 100, 300, 'First order reward bonus points', CURRENT_DATE),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'birthday_multiplier', 200, 500, '2x Birthday month bonus points applied', CURRENT_DATE),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'redemption', -100, 400, 'Redeemed points at checkout for ₹10 discount', CURRENT_DATE),

-- Kavita Patel (Crust)
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', 'order_earn', 250, 250, 'Points earned for order of amount 2500 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '2 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', 'bonus_earn', 100, 350, 'First order reward bonus points', CURRENT_DATE - INTERVAL '2 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007', 'order_earn', 300, 650, 'Points earned for order of amount 3000 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '45 days'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000008', 'order_earn', 125, 775, 'Points earned for order of amount 1000 (Tier multiplier: 1.25x)', CURRENT_DATE - INTERVAL '10 days'),

-- Sneha Reddy
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000009', 'order_earn', 80, 80, 'Points earned for order of amount 800 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '25 days'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000009', 'bonus_earn', 100, 180, 'First order reward bonus points', CURRENT_DATE - INTERVAL '25 days'),

-- Divya Nair
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000010', 'order_earn', 110, 110, 'Points earned for order of amount 1100 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '2 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000010', 'bonus_earn', 100, 210, 'First order reward bonus points', CURRENT_DATE - INTERVAL '2 months'),

-- Rohan Gupta
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000011', 'order_earn', 160, 160, 'Points earned for order of amount 1600 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '3 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000011', 'bonus_earn', 100, 260, 'First order reward bonus points', CURRENT_DATE - INTERVAL '3 months'),

-- Neha Sharma
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000012', 'order_earn', 140, 140, 'Points earned for order of amount 1400 (Tier multiplier: 1.0x)', CURRENT_DATE - INTERVAL '4 months'),
(gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000012', 'bonus_earn', 100, 240, 'First order reward bonus points', CURRENT_DATE - INTERVAL '4 months');
