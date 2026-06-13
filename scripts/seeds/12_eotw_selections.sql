-- 12_eotw_selections.sql

INSERT INTO public.eotw_selections (id, employee_id, week_start, week_end, score, avg_service_rating, orders_processed_ratio, punctuality_score, created_at) VALUES
-- 4 weeks ago: Winner Sunita Verma
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004', 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '28 days')::date, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '22 days')::date, 
 4.850, 5.00, 0.8500, 5.00, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '21 days')::date + INTERVAL '9 hours'),

-- 3 weeks ago: Winner Arjun Mehta
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '21 days')::date, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '15 days')::date, 
 4.500, 4.80, 0.7000, 4.50, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '14 days')::date + INTERVAL '9 hours'),

-- 2 weeks ago: Winner Priya Patel
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '14 days')::date, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '8 days')::date, 
 4.600, 4.90, 0.6500, 5.00, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::date + INTERVAL '9 hours'),

-- 1 week ago: Winner Deepak Joshi
(gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005', 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::date, 
 (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day')::date, 
 4.450, 4.70, 0.6000, 4.50, 
 DATE_TRUNC('week', CURRENT_DATE)::date + INTERVAL '9 hours');
