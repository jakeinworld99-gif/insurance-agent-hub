# Insurance Agent Hub — agents.md

Squad split for this sprint. Atlas is the PM, owns the Jira epic KAN-40 and every gate. The other agents own the phase tasks below.

| Phase | Owner | Jira key | What lands |
|---|---|---|---|
| Research | Lens | KAN-41 | This research, the Confluence page in space SD, and the three `*.md` files in this folder. |
| Design | Muse | KAN-42 | Figma file with all screens for the 12-step flow, mobile and desktop, with rationale. |
| Design feedback and changes | Muse | KAN-43 | Iterate on Atlas's review comments. |
| Development | Prime | KAN-44 | Repo at `/Users/namanpatel/Documents/demo-agent-projects/insurance-agent-hub/`, pushed to GitHub, with Vercel preview URL. Sub-tasks for FE, BE, seed and README. |
| QA and security | Vera | KAN-45 | Every step in the 12-step flow tested on the preview URL, plus auth-bypass, cross-agent data access, injection, secrets-in-client, HTTPS. |
| Deployment and release | Flux | KAN-46 | Production deploy on Vercel with every env var set, demo data seeded, README credentials verified. |

## Handoff rule between agents

- Each phase moves its Jira task to In Review with the artifact link (Confluence URL, Figma URL, preview URL, production URL). Never "done" without evidence.
- Atlas approves the gate and releases the next phase. Two rounds of feedback per phase, then escalate to David.
- The kanban chain wires the phases so each one auto-releases the next when its Jira ticket hits In Review and Atlas approves.

## What each agent owns in the repo

- **Prime** writes everything in `/Users/namanpatel/Documents/demo-agent-projects/insurance-agent-hub/`: the Next.js app, `supabase/schema.sql`, `supabase/seed.sql`, `README.md`, `product.md`, `architecture.md`, `agents.md`.
- **Vera** writes test evidence as Jira comments and as a `qa-report.md` in the repo if useful.
- **Flux** touches Vercel env vars and the production deploy. No code changes.
- **Lens, Muse** write only outside the repo: Confluence page (Lens), Figma file (Muse).

## Communications

All work happens in the project channel. Atlas posts the plan and the gates. Each agent posts one line in the channel when they start a ticket and the artifact when they finish. No long threads, no narrating someone else's work.