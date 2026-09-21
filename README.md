# Insurance Agent Hub

Scaffold for the Insurance Agent Hub. This is the empty shell only. The full 12-step build is tracked in Jira under KAN-44b.

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript

## Local development

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:3000.

## Environment variables

Set in Vercel project `insurance-agent-hub` (do not commit `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM=onboarding@resend.dev`

## Project docs

- `product.md` — product scope and goal
- `architecture.md` — stack decisions and data flow
- `agents.md` — agent ownership notes
- `design/mockup.html` — 12-step UX flow (Figma fallback)
