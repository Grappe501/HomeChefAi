# Marketing & Contracts Reconciliation — v5.1 / Legal v2.5

**Date:** June 2026  
**Product:** SousChef Brain 5.1 · Training Kitchen  
**Legal framework:** v2.5 (Terms, Privacy, AI Usage, Community, Sub-processors)

## Single source of truth

| Stat | Value | Source file |
|------|-------|-------------|
| Recipe library | 280,000+ | `src/content/marketingContent.ts` → `SITE_STATS.recipeCount` |
| Knowledge nodes | 400+ | `SITE_STATS.knowledgeNodes` |
| Techniques | 45+ | `SITE_STATS.techniques` |
| Taste profiles | 18 | `SITE_STATS.flavorProfiles` |
| Food sources | 21 | `SITE_STATS.foodSources` |
| Academy deep dives | 150+ | `SITE_STATS.deepDives` |
| Cuisines | 48 | `SITE_STATS.cuisines` |
| Clara tools | 9 | `SITE_STATS.claraTools` |
| Brain version | 5.1 | `SITE_STATS.brainVersion` |
| Legal version | 2.5 | `LEGAL_VERSION` |

## Updated surfaces

- `src/content/marketingContent.ts` — FAQ, pillars, trust strip, testimonials
- `src/content/siteContent.ts` — platform layers, vision, roadmap, pricing comparison
- `src/content/siteSearchData.ts` — Kitchen Academy search copy
- `src/pages/marketing/Landing.tsx`, `StoryPage.tsx`, `LearnIndex.tsx`, `HowItWorks.tsx`
- `public/legal/*.html` — v2.5, Training Kitchen, 280k corpus, Academy at 0 credits
- `README.md`, `package.json` description
- `data/marketing/search-index.json` — rebuild via `npm run search:index`

## Legal highlights (v2.5)

- Terms §1: Training Kitchen, 280k recipes, food sourcing education
- AI Usage: Kitchen Academy browse, skill coach, food sourcing tips at **0 credits**
- AI Usage: directions / "what can I make" at **0 credits** (Agent Suite v6)
- Privacy: preferred store + local food prefs in profile table

## Regenerate search index after content edits

```bash
npm run search:index
```
