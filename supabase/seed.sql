-- Seed: insurance products, one demo agent, and one demo customer.
-- Run this after the migration in the Supabase SQL editor or via CLI.

-- ─── Products ────────────────────────────────────────────────────────────────

insert into public.products (id, name, category, sum_insured_inr, base_premium_cents, base_term_years, applies_to, active) values
-- Term Life
(
  gen_random_uuid(), 'SecureLife Term 10', 'term',
  1_000_000, 29900, 10,
  '{"min_age": 18, "max_age": 50}'::jsonb, true
),
(
  gen_random_uuid(), 'SecureLife Term 20', 'term',
  2_000_000, 54900, 20,
  '{"min_age": 18, "max_age": 45}'::jsonb, true
),
-- Health
(
  gen_random_uuid(), 'HealthPlus Basic', 'health',
  300_000, 19900, null,
  '{"min_age": 18, "max_age": 65, "coverage_type": "individual"}'::jsonb, true
),
(
  gen_random_uuid(), 'HealthPlus Family', 'health',
  500_000, 34900, null,
  '{"min_age": 18, "max_age": 65, "coverage_type": "family"}'::jsonb, true
),
-- Vehicle
(
  gen_random_uuid(), 'MotorGuard Car', 'vehicle',
  500_000, 14900, null,
  '{"vehicle_types": ["car"], "min_age": 18, "max_age": 75}'::jsonb, true
),
(
  gen_random_uuid(), 'MotorGuard Bike', 'vehicle',
  200_000, 7900, null,
  '{"vehicle_types": ["bike"], "min_age": 18, "max_age": 70}'::jsonb, true
)
on conflict do nothing;

-- ─── Demo agent ───────────────────────────────────────────────────────────────
-- auth.users row created by Supabase Auth when you sign up with:
--   email:    demo@insurance-agent.dev
--   password:  DemoAgent123!
--
-- The handle_new_user trigger will auto-create the public.agents row.
-- Run this AFTER the demo agent has signed up:
--
--   UPDATE public.agents
--   SET full_name = 'Rajesh Kumar'
--   WHERE email = 'demo@insurance-agent.dev';

-- ─── Demo customer ───────────────────────────────────────────────────────────
-- After the demo agent exists, create a customer linked to them:
--
--   insert into public.customers
--     (agent_id, full_name, customer_email, phone, date_of_birth, vehicle_type, city, annual_income)
--   select
--     a.id, 'Priya Sharma', 'priya@example.com', '919876543210', '1990-05-15', 'car', 'Mumbai', 850000
--   from public.agents a where a.email = 'demo@insurance-agent.dev'
--   on conflict do nothing;
