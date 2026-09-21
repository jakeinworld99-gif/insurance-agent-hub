-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Auth trigger: auto-create agents row on new user ───────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.agents (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null check (category in ('term', 'health', 'vehicle')),
  sum_insured_inr  bigint not null default 0,
  base_premium_cents bigint not null default 0,
  base_term_years   integer,
  -- JSONB: term={min_age,max_age}, health={min_age,max_age,coverage_type}, vehicle={vehicle_types[],min_age,max_age}
  applies_to    jsonb not null default '{}',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.agents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references public.agents(id),
  full_name     text not null,
  customer_email text,          -- NEW: explicit customer email (may differ from auth email)
  email         text,          -- kept for compat; same as customer_email usually
  phone         text not null,
  date_of_birth text,          -- YYYY-MM-DD string
  vehicle_type  text,          -- 'car' | 'bike' | etc., null for non-vehicle
  occupation    text,
  annual_income numeric(12,2),
  city          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.proposals (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id),
  product_id    uuid not null references public.products(id),
  agent_id      uuid not null references public.agents(id),
  status        text not null default 'draft'
                  check (status in ('draft','sent','agreed','paid','expired')),
  premium       bigint,          -- stored as cents
  sum_insured   bigint,
  term_years    integer,
  pdf_url       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references public.proposals(id),
  token         text not null unique,
  amount_cents  bigint not null default 0,
  status        text not null default 'pending'
                  check (status in ('pending','paid','failed','refunded')),
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.policies (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid references public.proposals(id),
  customer_id   uuid references public.customers(id),
  product_id    uuid references public.products(id),
  agent_id      uuid references public.agents(id),
  policy_number text not null,
  premium       bigint not null,
  started_at    timestamptz,
  ended_at      timestamptz,
  status        text not null default 'active' check (status in ('active','cancelled','expired')),
  created_at    timestamptz not null default now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.products    enable row level security;
alter table public.agents      enable row level security;
alter table public.customers   enable row level security;
alter table public.proposals   enable row level security;
alter table public.payments    enable row level security;
alter table public.policies    enable row level security;

-- products: anyone can read active products
create policy "products_read_active" on public.products
  for select using (active = true);

-- agents: users can read their own agent row
create policy "agents_own" on public.agents
  for select using (auth.uid() = user_id);

-- customers: agents can only see their own customers
create policy "customers_own" on public.customers
  for all using (agent_id in (
    select id from public.agents where user_id = auth.uid()
  ));

-- proposals: agents see only their own
create policy "proposals_own" on public.proposals
  for all using (agent_id in (
    select id from public.agents where user_id = auth.uid()
  ));

-- payments: read via proposal ownership; insert/update via service role only (API routes use service key)
create policy "payments_read_via_proposal" on public.payments
  for select using (proposal_id in (
    select p.id from public.proposals p
    join public.agents a on a.id = p.agent_id
    where a.user_id = auth.uid()
  ));

-- policies: read via ownership
create policy "policies_read_own" on public.policies
  for select using (agent_id in (
    select id from public.agents where user_id = auth.uid()
  ));
