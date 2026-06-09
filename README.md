# SousChef

**Your Kitchen Has A Memory.**

SousChef is a household food operating system — pantry inventory, receipt scanning, Kitchen Memory (Brain 2.0), AI meal planning with reasoning, nutrition estimates, site search, Cook Together households, skills coaching, and hosting experience plans.

Consumer brand: **SousChef** · Legal entity: **HomeChef AI**

Production: https://home-chef-ai.netlify.app  
Launch page: https://home-chef-ai.netlify.app/landing

## Features (2.2)

- **Inventory** — receipt scanning, pantry/fridge/freezer, knowledge-linked items (270+ nodes)
- **Kitchen Memory** — Brain 2.0 graph, patterns, kitchen identity, decision ledger
- **Kitchen Intelligence** — 3-direction meal flow, Why this?, nutrition estimates, replace meal, Clara
- **Kitchen Growth** — technique micro-lessons, Cook Together coach, skill memories
- **Kitchen Legacy** — hosting timelines, tradition memories, recipe lineage
- **Cook Together** — household invites, shared pantry
- **Voice Sous Chef** — assistant with intent routing (meal plan, hosting, substitutions)
- **Marketing site** — platform drill-down, Kitchen Academy, site search (Find + Ask)

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

Published at `/legal/` — Terms, Privacy, AI Usage, Community Rules, Sub-processors (v2.2 frameworks).

## Database Migrations

Migrations in `supabase/migrations/`. Apply via Supabase CLI or dashboard. All 15 migrations applied on production project `xqvtnzfnjjsqgtcpkxbz`.
