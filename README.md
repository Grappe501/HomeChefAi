# SousChef

**Your Kitchen Has A Memory.**

SousChef is a household food operating system — pantry inventory, receipt and photo scanning, Brain 5.1 AI Impact Suite, 280,000+ recipe library, Training Kitchen & Kitchen Academy, nine-tool Clara router, multi-course meal planning, Hosting Studio, site search, Cook Together households, and a 400+ node knowledge graph.

Consumer brand: **SousChef** · Legal entity: **HomeChef AI** · **v5.1**

Production: https://home-chef-ai.netlify.app  
Launch page: https://home-chef-ai.netlify.app/landing

## Features (5.1)

- **Brain 5.1 — AI Impact Suite** — unified household context in planner + Clara; brain memories + ledger learning
- **Training Kitchen** — 45+ techniques, 18 taste profiles, 48 cultural cuisines, 21 food sources, 150+ Academy deep dives
- **Recipe Library** — 280,000+ recipes across 48 cuisines, 10 course types; pantry match at 0 credits
- **Clara Tool Router** — Agent Suite v6; 9 selective tools before GPT; dish recipe fast path (0 credits)
- **Multi-course meals** — dinner 1/3/4/5, lunch 2/3; slot drill-down at `/meals/:planId/slot/:slotId`
- **Proactive intelligence** — inline recipe directions, kitchen staple predictions (0 credits)
- **Unified AI credits** — 30 / 150 / 300 monthly pools aligned with legal policy v2.5
- **Inventory** — receipt scan, pantry photo scan (unit normalization), wizard, knowledge-linked items
- **Kitchen Memory** — Brain graph, proactive cards, kitchen identity, decision ledger
- **Kitchen Legacy** — Hosting Studio (live), neighbor swap, tradition memories, Cook Together
- **Marketing site v5.1** — Training Kitchen, 280k recipes, legal v2.5

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenAI GPT-4o-mini (receipts, planning, assistant, site Ask) |
| Knowledge | 400+ JSON nodes + 280k dish corpus in `data/ai/` |
| Hosting | Netlify |
| Billing | Stripe (Plus $9 / Family $18 — beta: full access) |

All development on **H:/ drive**.

## Quick Start

```bash
cd H:\HomeChefAi
copy .env.example .env.local
npm install
npm run db:init
npm run netlify:dev
```

App: http://localhost:8888

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (AI features) | OpenAI API key |
| `VITE_SUPABASE_URL` | Production | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions | Server-side Supabase |
| `USE_DEV_STORE` | Dev | `true` = local JSON store |

## Scripts

```bash
npm run typecheck      # TypeScript check
npm run test:knowledge # Knowledge corpus tests
npm run build          # Search index + sitemap + production build
npm run netlify:dev    # Local app + functions
npm run generate:dishes # Regenerate 280k recipe corpus
npm run knowledge:training # Training Kitchen nodes + Academy deep dives
```

## Netlify Deployment

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- Env: `OPENAI_API_KEY`, Supabase keys, `USE_DEV_STORE=false`

Marketing site is integrated in the main app at `/landing` (legacy `marketing/` folder redirects).

## Legal

Published at `/legal/` — Terms, Privacy, AI Usage, Community Rules, Sub-processors (v2.4 · Brain 5.0).

## Database Migrations

Migrations in `supabase/migrations/`. Apply via Supabase CLI or dashboard. All 15 migrations applied on production project `xqvtnzfnjjsqgtcpkxbz`.
