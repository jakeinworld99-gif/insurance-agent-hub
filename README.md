# Insurance Agent Hub

Sell Term, Health and Vehicle insurance policies end to end.

## Tech stack

Next.js 14 (App Router) · Supabase (Auth, DB, RLS) · Tailwind CSS · @react-pdf/renderer · Resend

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase + Resend keys
npm run dev
```

## Supabase

1. Run `supabase/migrations/001_schema.sql` in your Supabase SQL editor.
2. Run `supabase/seed.sql` after creating the demo agent account.
3. Auth is configured with email sign-up and auto-confirm (no email verification).

## Demo credentials

Sign up at `/signup` with any email and password. The `handle_new_user` trigger
auto-creates the `agents` row on first login.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `DATABASE_URL` | Postgres connection string |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | From address for emails (e.g. `onboarding@resend.dev`) |

## Routes

| Route | Auth | Description |
|---|---|---|
| `/` | No | Landing page |
| `/signup`, `/login` | No | Auth pages |
| `/dashboard` | Yes | Agent's customer list |
| `/products` | Yes | Product catalogue |
| `/customers/new` | Yes | Add customer form |
| `/customers/[id]` | Yes | Customer detail + eligible products |
| `/customers/[id]/proposal/[pid]` | Yes | Proposal detail, PDF, agree, payment link, WhatsApp share |
| `/pay/[token]` | No | Public payment page (demo) |
| `/pay/[token]/success` | No | Payment success + WhatsApp share |
| `/api/proposals/[id]/pdf` | No | Downloadable PDF proposal |

## Note

This is a demonstration application. No real insurance products are offered and no real payments are processed.
