-- Seed Data for Ace Noir Employee App
-- Run this AFTER schema.sql and AFTER creating your first admin user

-- =====================================================
-- FACILITIES
-- =====================================================
INSERT INTO public.facilities (name, address, city, state, zip_code, latitude, longitude, is_active) VALUES
('Love Bug N Me', '1127 Mission St', 'South Pasadena', 'CA', '91030', 34.1161, -118.1505, true),
('Maison Louis Marie', '3820 Medford St', 'Los Angeles', 'CA', '90063', 34.0445, -118.1756, true),
('Harvest Pack Inc', '12336 Lower Azusa Rd', 'Arcadia', 'CA', '91006', 34.1114, -117.9898, true),
('Uplift Therapy Center', '1975 Verdugo Blvd Suite D', 'La Cañada Flintridge', 'CA', '91011', 34.2097, -118.2003, true),
('Pasadena Chamber of Commerce', '44 N Mentor Ave', 'Pasadena', 'CA', '91106', 34.1478, -118.1445, true),
('Western Sound', '5532 N Figueroa St Ste B', 'Los Angeles', 'CA', '90042', 34.1116, -118.1932, true);

-- =====================================================
-- INITIAL PAY PERIODS (Bi-weekly starting from Jan 2024)
-- =====================================================
INSERT INTO public.pay_periods (start_date, end_date, status) VALUES
('2024-12-16', '2024-12-29', 'open'),
('2024-12-30', '2025-01-12', 'open'),
('2025-01-13', '2025-01-26', 'open'),
('2025-01-27', '2025-02-09', 'open'),
('2025-02-10', '2025-02-23', 'open');

-- =====================================================
-- MAKE FIRST USER ADMIN
-- Replace 'your-email@example.com' with your actual email
-- =====================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
