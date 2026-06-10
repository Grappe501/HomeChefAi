# SousChef

**Your Kitchen Has A Memory.**

SousChef is a household food operating system — pantry inventory, receipt and photo scanning, Brain 5.2 AI Impact Suite, Kitchen Learning Engine v7.4, **284,255** structured recipes, Training Kitchen & Kitchen Academy, nine-tool Clara router, multi-course meal planning, Hosting Studio, site search, Cook Together households, and a 400+ node knowledge graph.

Consumer brand: **SousChef** · Legal entity: **HomeChef AI** · **v7.4**

Production: https://home-chef-ai.netlify.app  
Launch page: https://home-chef-ai.netlify.app/landing

## Features (7.4)

- **Kitchen Learning Engine** — taste, rhythm, skills, and household identity learners that compound from every cook
- **Brain 5.2 — AI Impact Suite** — unified household context in planner + Clara; brain memories + ledger learning
- **Training Kitchen** — 53+ techniques, 18 taste profiles, 48 cultural cuisines, 21 food sources, 161+ Academy deep dives
- **Recipe Library** — 284,000+ recipes across 48 cuisines, 10 course types; pantry match at 0 credits
- **Clara Agent Suite v6** — nine tools first, BM25 + shard hybrid search, streaming expert synthesis
- **Kitchen Academy** — three featured career paths with pantry-matched practice recipes
- **Multi-course meal planning** — slot drill-down, Why this?, supply lists
- **Marketing site v7.4** — manifest-synced stats, KLE positioning, legal v2.7

## Stack

| Layer | Detail |
|-------|--------|
| Frontend | React + Vite + Tailwind |
| Backend | Netlify Functions |
| Database | Supabase (Postgres + Auth) |
| Knowledge | 400+ JSON nodes + 284k dish corpus in `data/ai/` |
| AI | OpenAI (Clara router, vision, synthesis) |

## Quick start

```bash
npm install
cp .env.example .env.local   # add Supabase + OpenAI keys
npm run dev
```

## Knowledge pipeline

```bash
npm run knowledge:all        # Full regen: pantry, dishes, search pack, training
npm run knowledge:dishes     # Regenerate 284k recipe corpus
npm run build:marketing-stats # Sync recipe counts into marketing content
npm run search:index         # Rebuild site search index
```

## Marketing stats

Recipe counts on the website are generated from `data/ai/dish-manifest.json` at build time via `scripts/build-marketing-stats.mjs` → `src/content/siteStats.generated.ts`. Run after corpus changes so landing pages stay accurate.

## License

Proprietary — HomeChef AI.
