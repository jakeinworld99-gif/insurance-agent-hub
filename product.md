# Insurance Agent Hub — product.md

A prototype that lets an independent insurance agent sell Term, Health and Vehicle policies end to end: sign up, capture a customer, generate a personalised PDF proposal, share via WhatsApp, take a demo payment, and email a policy confirmation.

This file maps the 12-step user flow to the screens, data and integrations that need to exist. Architecture lives in `architecture.md`. Squad ownership lives in `agents.md`.

## The flow, step by step

| # | Step (from epic) | Screen / route | Data touched | Integration |
|---|---|---|---|---|
| 1 | Agent signs up and logs in | `/signup`, `/login` | `auth.users`, `agents` row | Supabase Auth (email + password) |
| 2 | Agent views all available products across categories | `/products` | `products` rows | none (seeded in `supabase/seed.sql`) |
| 3 | Agent enters a prospective customer's details | `/customers/new` | `customers` insert | none |
| 4 | Saving the details creates a customer profile | `/customers/[id]` | `customers` row created, view routed | none |
| 5 | The app shows the policies applicable to that customer | `/customers/[id]` (proposals tab) | read `products`, filter by `applies_to` JSON | none |
| 6 | Agent selects the product the customer wants | `/customers/[id]/pick` | `proposals` insert (draft) | none |
| 7 | The app generates a personalised PDF insurance document for that customer and product | POST `/api/proposals/[id]/pdf` | update `proposals.pdf_url` | `@react-pdf/renderer` in a Next.js Route Handler |
| 8 | Agent shares the PDF through WhatsApp | share button on `/customers/[id]/proposal/[proposalId]` | none | `wa.me/<phone>?text=...&url=<pdf_url>` deep link |
| 9 | The customer reviews the document, including the premium, and agrees | customer opens PDF; agent marks "agreed" on `/customers/[id]/proposal/[proposalId]` | `proposals.status` → `agreed` | none |
| 10 | From the same profile, the agent generates a payment link | POST `/api/proposals/[id]/payment-link` | `payments` insert (status `pending`, token = random 32 chars) | none |
| 11 | The agent shares the payment link through WhatsApp | share button | none | `wa.me/<phone>?text=...&url=<payments_url>` |
| 12 | When payment succeeds, the customer gets an email confirming the policy has started | `/pay/[token]` page, server marks `payments.status = paid`, fires email | `payments.status` → `paid`, `policies` insert | Resend API |

## Roles

- **Agent** — the authenticated user. Owns customers and proposals. Sees only their own rows (RLS enforces).
- **Customer** — never logs in. Identity is the `customers` row the agent created, plus a `customer_email` used for the Resend confirmation.

## Demo data

- One demo agent: email = Resend account owner email (Prime pulls it from the first Resend test send), password `demo1234`.
- One demo customer, attached to the demo agent.
- Three products: Term Life, Health, Vehicle. Each has an `applies_to` JSON that filters which customers it matches (age band, vehicle type, etc.).

## Out of scope (per epic)

Real payment gateway, KYC, e-sign, IRDAI compliance, WhatsApp Business API, multi-tenant, mobile native, tests beyond acceptance criteria.

## Non-goals for the prototype

- No real money movement. `/pay/[token]` is a fake page that flips status on click.
- No WhatsApp Business API. Only `wa.me` deep links, which open the customer's installed WhatsApp.
- No real Resend domain. Email is sent from `onboarding@resend.dev`, which only delivers to the Resend account owner email. See `architecture.md` for the constraint and the workaround.