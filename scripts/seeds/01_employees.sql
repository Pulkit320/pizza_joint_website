-- 01_employees.sql

-- Insert 10 employees (5 required from spec + 5 additional to cover roles)
INSERT INTO public.employees (id, first_name, last_name, email, password_hash, role, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'Ravi', 'Sharma', 'ravi.sharma@pizzajoint.com', '$2b$10$31Fw8QJYXNDItscHC1.aNujKYihsPN5rqLlAXT7bKY3shfijryaFm', 'manager', '2022-01-15 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000002', 'Priya', 'Patel', 'priya.patel@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'server', '2022-03-10 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000003', 'Arjun', 'Mehta', 'arjun.mehta@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'delivery_driver', '2023-06-01 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000004', 'Sunita', 'Verma', 'sunita.verma@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'chef', '2021-11-20 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000005', 'Deepak', 'Joshi', 'deepak.joshi@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'delivery_driver', '2023-08-15 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000006', 'Rohan', 'Das', 'rohan.das@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'cashier', '2023-01-10 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000007', 'Amit', 'Verma', 'amit.verma@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'chef', '2022-06-15 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000008', 'Vikram', 'Roy', 'vikram.roy@pizzajoint.com', '$2b$10$31Fw8QJYXNDItscHC1.aNujKYihsPN5rqLlAXT7bKY3shfijryaFm', 'manager', '2022-09-01 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000009', 'Sanjay', 'Sen', 'sanjay.sen@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'server', '2023-04-12 00:00:00+05:30'),
('a1000000-0000-0000-0000-000000000010', 'Anil', 'Rao', 'anil.rao@pizzajoint.com', '$2b$10$c43JabQmvFa99IyrUbSVvu2imnPqGmleAi5QrTeVM.G8znjQLrY2O', 'delivery_driver', '2023-10-20 00:00:00+05:30');

-- Dynamically generate shifts for the last 6 months for all staff employees (excluding managers)
-- Sunita Verma (chef 'a1000000-0000-0000-0000-000000000004') is guaranteed to be 100% on time to support EOTW winning calculations.
INSERT INTO public.shifts (id, employee_id, shift_date, start_time, end_time, is_late)
SELECT 
    gen_random_uuid(),
    emp.id,
    day::date,
    '09:00:00'::time,
    '17:00:00'::time,
    (CASE WHEN emp.id = 'a1000000-0000-0000-0000-000000000004' THEN false ELSE (random() < 0.1) END)
FROM 
    (SELECT id FROM public.employees WHERE role NOT IN ('manager', 'admin')) emp
CROSS JOIN 
    generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 day'::interval) day
WHERE 
    EXTRACT(DOW FROM day) NOT IN (0); -- Off on Sundays
