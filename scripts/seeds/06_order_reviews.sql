-- 06_order_reviews.sql

INSERT INTO public.order_reviews (id, order_id, customer_id, overall_score, food_quality_score, speed_score, written_comment, would_order_again, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 5, 5, 5, 'Amazing big feast! Perfectly cooked and delivered hot.', true, CURRENT_DATE - INTERVAL '5 months'),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 5, 5, 5, 'Fabulous pizza, fresh ingredients, arrived very quickly.', true, MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 1) + INTERVAL '1 hour'),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 4, 4, 4, 'Tastes great and got my birthday reward discount!', true, CURRENT_DATE + INTERVAL '1 hour');
