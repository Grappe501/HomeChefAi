# Marketing Reconciliation 5.0

**Date:** June 2026  
**Product version:** SousChef v5.0 · Brain 5.0  
**Legal version:** 2.4  
**Status:** Reconciled against production build

## Executive summary

Marketing, legal, brand, and platform content were updated from Brain 4.0 / v4.0 / legal v2.3 to reflect everything shipped in Brain 5.0: AI Impact Suite, 40,127-recipe library, nine-tool Clara router, multi-course meal planning, proactive inline directions, inventory unit normalization, and partial PWA install.

---

## Build vs website — gap analysis (resolved)

| Area | Was on website | Actual product | Resolution |
|------|----------------|----------------|------------|
| Version | v4.0 / Brain 4.0 | v5.0 / Brain 5.0 | `SITE_VERSION`, all marketing pages, README, package.json |
| Knowledge | 270+ nodes | 360+ nodes + 40,127 recipes | `SITE_STATS`, siteContent, FAQ |
| Recipes | Roadmap: "restoring soon" | `/recipes` live (Recipe Ideas) | New feature card, roadmap, cookbook vision |
| Clara tools | 4–5 tools | 9 deterministic tools | siteContent, ai-usage.html, FAQ |
| Multi-course | Not mentioned | Dinner 1/3/4/5, lunch 2/3, slot drill-down | New feature + FAQ |
| AI Impact Suite | Not mentioned | `kitchenBrainContext`, planner feedback | New pillar + memory feature |
| PWA | Roadmap only | Manifest + InstallPrompt (no SW) | Beta feature card |
| Legal credits | v2.3, Brain 4.0 | 0-credit recipe/skill paths | ai-usage.html v2.4 |
| Stats strip | Knowledge nodes | Recipe library focus | 40k+, 48 cuisines, 9 tools |
| Testimonials | Generic Brain 4 quotes | Recipe + multi-course + pantry fix | Updated quotes |

---

## Still honestly labeled (not oversold)

| Item | Status | Marketing label |
|------|--------|-----------------|
| Stripe billing | Infrastructure ready, `ENABLE_BILLING=false` | Beta — "when billing launches" |
| Cookbook social feed | API partial; `Recipes.tsx` not routed | Roadmap Phase 10 |
| Full offline PWA | No service worker | Beta (install prompt) / roadmap |
| Data export UI | Email-only per FAQ | FAQ says Settings or email |
| Brain 1.0B | Not built | Vision topic |
| Famous styles layer | Not built | Vision topic |

---

## Files updated (this reconciliation)

### Brand & marketing content
- `src/content/marketingContent.ts` — v5 stats, 5 pillars, FAQ, testimonials, trust
- `src/content/siteContent.ts` — features, roadmap, pricing, vision, in-app routes
- `src/pages/marketing/Landing.tsx` — hero, meta, pillars, CTAs
- `src/pages/marketing/ExploreIndex.tsx`, `HowItWorks.tsx`, `PricingPage.tsx`, `StoryPage.tsx`
- `src/components/marketing/MarketingBlocks.tsx` — stats strip

### Legal (v2.4)
- `public/legal/ai-usage.html` — recipe library, skill coach, 9 tools, Brain 5.0
- `public/legal/terms.html` — service scope
- `public/legal/privacy.html` — Brain 5.0 AI section
- `public/legal/community.html` — Recipe Ideas live note
- `public/legal/sub-processors.html` — version bump

### Project docs
- `README.md` — v5.0 feature list
- `package.json` — 5.0.0
- `develop_notes/CONTRACTS_AND_MARKETING_STATUS_2_0.md` — status table

### Regenerated on build
- `data/marketing/search-index.json` — via `npm run build`

---

## Live product inventory (reference)

**App routes:** `/`, `/inventory`, `/receipt`, `/pantry-scan`, `/wizard`, `/meals`, `/meals/:planId/slot/:slotId`, `/recipes`, `/calendar`, `/cook`, `/assistant`, `/hosting`, `/brain`, `/learn`, `/community`, `/settings`

**Marketing routes:** `/landing`, `/explore`, `/pricing`, `/how`, `/story`, `/vision`, `/learn`

**Netlify functions (22):** auth, profile, inventory, receipts, pantry-scan, meals, assistant, cook-infer, brain, experience-plan, calendar, usage, recipes, swap, household, skills, knowledge, billing-status, billing-webhook, suggestions, site-search, product-journal

**Credits:** Free 30 / Plus 150 / Family 300

**Recipe corpus:** 40,127 dishes · 48 cuisines · 10 courses · partitioned in `data/ai/dishes/corpus/`

---

## Pre-launch checklist (unchanged)

- [ ] Attorney review of `/legal/*` v2.4
- [ ] Stripe live mode + checkout
- [ ] Confirm production env: `SUPABASE_SERVICE_ROLE_KEY`, credit migration
- [ ] Real named testimonials when available
- [ ] Settings data export UI (FAQ currently promises email path)

---

## Marketing rule

Consumer-facing name: **SousChef**. Legal entity **HomeChef AI** in footer, Terms, app store seller field only.
