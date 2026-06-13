-- 08_employee_ratings.sql

INSERT INTO public.employee_ratings (id, employee_id, order_id, customer_id, service_score, written_note, tags, is_excluded, excluded_reason, excluded_by, excluded_at, created_at) VALUES
-- Priya Patel (server) rated by Rajesh Kumar for Order 15
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001', 5, 'Excellent service, very friendly!', ARRAY['friendly', 'fast']::employee_rating_tag[], false, NULL, NULL, NULL, CURRENT_DATE - INTERVAL '2 months'),

-- Arjun Mehta (delivery) rated by Aarav Mehta for Order 3
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 5, 'Super fast delivery, hot pizza!', ARRAY['fast', 'friendly']::employee_rating_tag[], false, NULL, NULL, NULL, MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1) + INTERVAL '2 hours'),

-- Deepak Joshi (delivery) rated by Sneha Reddy for Order 9
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000007', 5, 'Very polite and professional driver.', ARRAY['friendly', 'professional']::employee_rating_tag[], false, NULL, NULL, NULL, CURRENT_DATE - INTERVAL '25 days'),

-- Excluded Rating: Priya Patel rated by Aarav Mehta for Order 17, excluded by manager Ravi Sharma
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000002', 5, 'Fake review test entry.', ARRAY['fast']::employee_rating_tag[], true, 'Suspected collusion/fake review', 'a1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 month' + INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 month');
