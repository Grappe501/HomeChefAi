# SousChef

**Your Kitchen Has A Memory.**

SousChef is a household food operating system — pantry inventory, receipt and photo scanning, Brain 4.0 proactive intelligence, Clara tool router, AI meal planning, Hosting Studio, site search, Cook Together households, and a 270+ node knowledge graph.

Consumer brand: **SousChef** · Legal entity: **HomeChef AI** · **v4.0**

Production: https://home-chef-ai.netlify.app  
Launch page: https://home-chef-ai.netlify.app/landing

## Features (4.0)

- **Brain 4.0** — Clara Tool Router, proactive predictions, expert council synthesis, pantry vision
- **Clara** — graph-first substitutions (0 credits), evidence chips, mobile session refresh
- **Unified AI credits** — 30 / 150 / 300 monthly pools aligned with legal policy v2.3
- **Inventory** — receipt scan, pantry photo scan, wizard, knowledge-linked items (270+ nodes)
- **Kitchen Memory** — Brain 2.0 graph, proactive cards, kitchen identity, decision ledger
- **Kitchen Intelligence** — 3-direction flow, Why this?, nutrition, cook log infer, calendar
- **Kitchen Legacy** — Hosting Studio (live), neighbor swap, tradition memories, Cook Together
- **Marketing site v4** — editorial redesign, Brain 4.0 platform map, legal v2.3

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenAI GPT-4o-mini (receipts, planning, assistant, site Ask) |
| Knowledge | 270+ JSON nodes in `data/ai/` |
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
```

## Netlify Deployment

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- Env: `OPENAI_API_KEY`, Supabase keys, `USE_DEV_STORE=false`

Marketing site is integrated in the main app at `/landing` (legacy `marketing/` folder redirects).

## Legal

Published at `/legal/` — Terms, Privacy, AI Usage, Community Rules, Sub-processors (v2.3 · Brain 4.0).

## Database Migrations

Migrations in `supabase/migrations/`. Apply via Supabase CLI or dashboard. All 15 migrations applied on production project `xqvtnzfnjjsqgtcpkxbz`.
