# Marketing & Contracts Reconciliation — v5.2 / Legal v2.6

**Date:** June 2026  
**Product:** SousChef Brain 5.2 · Agent Suite v6 Phase 4 · Kitchen Academy tracks  
**Legal framework:** v2.6 (Terms, Privacy, AI Usage, Community, Sub-processors)

## Single source of truth

| Stat | Value | Source file |
|------|-------|-------------|
| Recipe library | 280,000+ | `SITE_STATS.recipeCount` |
| Techniques | 53+ | `SITE_STATS.techniques` |
| Academy paths | 3 | `SITE_STATS.academyPaths` |
| Agent Suite | v6 Phase 4 | `SITE_STATS.agentSuite` |
| Brain version | 5.2 | `SITE_STATS.brainVersion` |
| Legal version | 2.6 | `LEGAL_VERSION` |

## Shipped in v5.2

- Agent Suite v6 Phase 4 — embedding shards, streaming synthesis, agent telemetry
- Kitchen Academy featured pathways (Executive Chef, Master Baker, Game Show Kitchen)
- Deploy fix — BM25 search pack in functions; full corpus static on CDN
- Supabase migration `agent_loop_telemetry`

## Regenerate after content edits

```bash
npm run search:index
npm run knowledge:search-pack   # Netlify build runs this automatically
npm run knowledge:embed-shards  # Optional — requires OPENAI_API_KEY
```
