# Insurance Agent Hub — architecture.md

Technical decisions for the prototype. Product context is in `product.md`. Squad split is in `agents.md`.

## Stack pick

| Piece | Choice | Reason (fastest path to a Vercel deploy) |
|---|---|---|
| Framework | Next.js 14 App Router | One project serves UI, API routes and the PDF endpoint. Vercel deploy is zero config. App Router lets the PDF route handler run on the Node runtime (not Edge) so `@react-pdf/renderer` works. |
| Hosting | Vercel | Native Next.js, env vars in dashboard, preview URLs per branch. |
| Auth + DB + RLS | Supabase | Postgres for the relational data, RLS so the prototype is safe without a custom auth middleware, Supabase Auth for the agent signup/login with a single client. |
| Email | Resend | One API call per confirmation. DX is clean and it has a `react-email` integration. |
| PDF | `@react-pdf/renderer` in a Next.js Route Handler | React component → PDF in the same language as the UI. Runs on Node runtime; no headless browser, no separate worker. |
| WhatsApp share | `wa.me/<phone>?text=…&url=…` deep link | No WhatsApp Business API approval, no Twilio. Opens the customer's installed WhatsApp with a prefilled message and the public PDF URL. |
| Demo payment | In-app route `/pay/[token]` | No Stripe, no gateway signup. The page flips `payments.status` and fires the confirmation email. |
| Styling | Tailwind + shadcn/ui | Same stack as prior sprints, lets Muse reuse components. |

## Alternative considered and rejected

**Vite + React Router + Express + Postgres on a small VPS.** Rejected because:
- Three deploy targets instead of one. Time budget for this sprint is 30 minutes total, and Vercel's zero-config Next.js deploy is the single biggest time-saver we have.
- Custom auth middleware duplicates what Supabase Auth + RLS gives us for free.
- The PDF route would need its own Express server on the Node runtime, with separate CORS and file-serving config. The Next.js Route Handler collapses that into one file.

Next.js is the right call here. Vite would only win if the brief demanded a static SPA with no server-side routes, which the PDF endpoint rules out.

## Resend sender constraint

Resend will only accept `onboarding@resend.dev` as the `from` address until a real domain is verified (DNS records + click-to-confirm link). Verified domain setup is out of scope for a 30-minute sprint.

**Consequence:** emails sent from `onboarding@resend.dev` only deliver to the **Resend account owner email** — the address used to create the Resend account. They do not deliver to arbitrary customer addresses.

**Workaround for the demo:**
1. Prime gets the Resend account owner email from the first Resend test send.
2. The demo customer's `customer_email` is set to that same address in `supabase/seed.sql`.
3. The flow still exercises the full path: payment success → row update → Resend API call → confirmation delivered to the owner's inbox. The "customer" is the founder watching their own inbox.

This is called out in `product.md` and in the seed SQL comments so it does not look like a bug on demo day.

## Supabase schema (sketch)

```sql
-- agents: 1:1 with auth.users
create table agents (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz default now()
);

-- customers: scoped to an agent
create table customers (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  full_name text not null,
  phone text not null,
  customer_email text,
  date_of_birth date,
  vehicle_type text, -- for Vehicle products
  created_at timestamptz default now()
);

-- products: seeded, no writes from app
create table products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('term','health','vehicle')),
  name text not null,
  base_premium_cents int not null,
  applies_to jsonb not null, -- e.g. {"min_age": 18, "max_age": 65} or {"vehicle_types": ["car","bike"]}
  terms_md text not null
);

-- proposals: a customer's interest in a product
create table proposals (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id),
  status text not null default 'draft' check (status in ('draft','sent','agreed','paid','expired')),
  pdf_url text,
  created_at timestamptz default now()
);

-- payments: one per proposal, demo only
create table payments (
  token text primary key, -- 32-char random, used in /pay/[token]
  proposal_id uuid not null references proposals(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','paid')),
  amount_cents int not null,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- policies: created after payment
create table policies (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id),
  started_at timestamptz default now()
);
```

## RLS sketch

Enable RLS on every table. Policy shape is "agent sees their own rows":

```sql
alter table agents enable row level security;
create policy "agent reads own row" on agents
  for select using (auth.uid() = id);
create policy "agent updates own row" on agents
  for update using (auth.uid() = id);

alter table customers enable row level security;
create policy "agent reads own customers" on customers
  for select using (auth.uid() = agent_id);
create policy "agent inserts own customers" on customers
  for insert with check (auth.uid() = agent_id);
create policy "agent updates own customers" on customers
  for update using (auth.uid() = agent_id);
create policy "agent deletes own customers" on customers
  for delete using (auth.uid() = agent_id);

-- Same pattern for proposals, payments, policies.
-- products: readable by any authenticated user, no writes.
alter table products enable row level security;
create policy "any agent reads products" on products
  for select using (auth.role() = 'authenticated');
```

The `/pay/[token]` page is server-rendered with the **service role** key (never exposed to the client) so an unauthenticated customer can still flip their payment status. The route handler reads the payment by `token`, not by `auth.uid()`.

## API route plan

| Route | Method | Purpose |
|---|---|---|
| `/api/proposals/[id]/pdf` | POST | Render the PDF, upload to Supabase Storage, set `proposals.pdf_url` |
| `/api/proposals/[id]/payment-link` | POST | Insert a `payments` row with a random token, return `/pay/[token]` |
| `/pay/[token]` | GET | Render the demo payment page for the customer |
| `/pay/[token]` | POST | Flip `payments.status` to `paid`, insert a `policies` row, fire Resend email |

## PDF approach

- `@react-pdf/renderer` runs in a Next.js Route Handler with `export const runtime = 'nodejs'`.
- The component takes the `proposal`, `customer` and `product` rows and renders a React tree to a PDF buffer.
- Buffer goes to Supabase Storage bucket `proposals`, file name `<proposal_id>.pdf`. Bucket is public read so the `wa.me` URL works without an auth flow on the customer's phone.
- Storage RLS: only the owning agent can write to their folder; anyone with the URL can read.

## Environment variables (in `.env.local` and Vercel)

| Var | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings, server-only |
| `RESEND_API_KEY` | Resend dashboard |
| `RESEND_FROM` | hardcoded `onboarding@resend.dev` for this sprint |

## Open questions

- **Resend account owner email.** Prime needs to send one test email and read the destination. Until then we cannot seed `customer_email`.
- **Vehicle product applicability.** Seed will use simple vehicle type strings ("car", "bike"); need to confirm with David if "truck" counts.
- **PDF terms content.** `products.terms_md` is placeholder markdown. Real policy text is out of scope.