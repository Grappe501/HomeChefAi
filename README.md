# SousChef

**Your Kitchen Has A Memory.**

SousChef is a household food operating system — pantry inventory, receipt scanning, Kitchen Memory (Brain 2.0), AI meal planning with reasoning, Cook Together households, skills coaching, and hosting experience plans.

Consumer brand: **SousChef** · Legal entity: **HomeChef AI**

Production: https://home-chef-ai.netlify.app  
Launch page: https://home-chef-ai.netlify.app/landing

## Features (2.0)

- **Inventory** — receipt scanning, pantry/fridge/freezer, knowledge-linked items
- **Kitchen Memory** — Brain 2.0 graph, patterns, kitchen identity, decision ledger
- **Kitchen Intelligence** — 3-direction meal flow, Why this?, replace meal, orchestrator
- **Kitchen Growth** — technique micro-lessons, Cook Together coach, skill memories
- **Kitchen Legacy** — hosting timelines (potluck, dinner party, game day, holiday), tradition memories, recipe lineage
- **Cook Together** — household invites, shared pantry
- **Voice Sous Chef** — assistant with intent routing (meal plan, hosting, substitutions)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenAI GPT-4o-mini (receipts, planning, assistant) |
| Knowledge | 250+ JSON nodes in `data/ai/` |
| Hosting | Netlify (app + separate marketing site) |
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
npm run build          # Production build → dist/
npm run netlify:dev    # Local app + functions
```

## Netlify Deployment

**App site** (main branch):

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- Env: `OPENAI_API_KEY`, Supabase keys, `USE_DEV_STORE=false`

**Marketing site** (`marketing/` folder, separate Netlify site optional):

- Publish directory: `marketing` (see `marketing/netlify.toml`)

## Database Migrations

Migrations live in `supabase/migrations/`. Apply via Supabase CLI or dashboard.

## Legal

Draft legal pages (attorney review before first charge):

- `/legal/terms.html`
- `/legal/privacy.html`
- `/legal/ai-usage.html`

Full frameworks: `develop_notes/TERMS_AND_COMMUNITY_RULES_2_0.md`, `PRIVACY_AND_DATA_POSITIONING_2_0.md`, `AI_CREDITS_AND_FAIR_USE_2_0.md`

## Repo

https://github.com/Grappe501/HomeChefAi
