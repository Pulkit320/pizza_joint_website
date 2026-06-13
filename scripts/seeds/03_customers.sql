-- 03_customers.sql

-- 1. Insert Rajesh Kumar first (referenced by Aarav Mehta)
INSERT INTO public.customers (id, first_name, last_name, email, password_hash, date_of_birth, referred_by) VALUES
('c1000000-0000-0000-0000-000000000001', 'Rajesh', 'Kumar', 'rajesh.kumar@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1995-05-10', NULL);

-- 2. Insert Aarav Mehta (referred by Rajesh Kumar) and Aditi Rao (referred by none, but refers Kavita Patel)
INSERT INTO public.customers (id, first_name, last_name, email, password_hash, date_of_birth, referred_by) VALUES
('c1000000-0000-0000-0000-000000000002', 'Aarav', 'Mehta', 'aarav.mehta@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', MAKE_DATE(1995, EXTRACT(MONTH FROM CURRENT_DATE)::integer, 15), 'c1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000004', 'Aditi', 'Rao', 'aditi.rao@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', MAKE_DATE(1990, EXTRACT(MONTH FROM CURRENT_DATE)::integer, EXTRACT(DAY FROM CURRENT_DATE)::integer), NULL);

-- 3. Insert remaining customers (referred by Aarav Mehta and Aditi Rao, plus independent ones)
INSERT INTO public.customers (id, first_name, last_name, email, password_hash, date_of_birth, referred_by) VALUES
('c1000000-0000-0000-0000-000000000003', 'Vikram', 'Singh', 'vikram.singh@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1988-12-05', 'c1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000005', 'Kavita', 'Patel', 'kavita.patel@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1993-04-20', 'c1000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000006', 'Rahul', 'Sharma', 'rahul.sharma@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1991-09-18', NULL),
('c1000000-0000-0000-0000-000000000007', 'Sneha', 'Reddy', 'sneha.reddy@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1996-07-22', NULL),
('c1000000-0000-0000-0000-000000000008', 'Divya', 'Nair', 'divya.nair@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1994-02-14', NULL),
('c1000000-0000-0000-0000-000000000009', 'Rohan', 'Gupta', 'rohan.gupta@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1992-11-30', NULL),
('c1000000-0000-0000-0000-000000000010', 'Neha', 'Sharma', 'neha.sharma@gmail.com', '$2b$10$imOTXnV2FuKfnWcHqevsw.9oS4HBouiKzc.MdpyCG3/Pb36NUPJ/6', '1997-03-05', NULL);
