# AI Save Point 1.0

**Date:** June 2026  
**Status:** 🔒 Feature freeze — AI Foundation phase begins  
**Duration:** 4–6 weeks (target)  
**Next initiative:** [SOUSCHEF_AI_FOUNDATION_1_0.md](./SOUSCHEF_AI_FOUNDATION_1_0.md)

---

## Decision

**Freeze feature expansion.** Not forever — long enough to build the intelligence layer correctly.

Most food apps have features. Very few have a true intelligence core.

SousChef has the skeleton. The next phase builds the brain.

---

## ✅ COMPLETED (bookmark)

| Area | Milestone | Notes |
|------|-----------|-------|
| Brand | Brand Freeze 1.0 | SousChef · Chef · Clara |
| Design | Design System 1.1 | Stainless / Chef Black / Copper |
| Platform | V3.1 Hardening | Auth, profile, Netlify deploy |
| Brain | Brain 1.0A | Deterministic memories, `/brain` UI |
| Meals | Meal Planner 2.0 | Coverage, realism, metrics, review MVP |
| Pantry | Wizard Units 1.0 | Human-sized units (82 items) |
| Pantry | Food Taxonomy 1.1 | Cheese/Tomatoes form-first; 8 family trees |
| Internal | Product Journal | Founder notes |
| Business | Marketing/Contracts 2.0 | Pricing, moat, launch audit |
| Architecture | Household Food Graph 1.0 | Master model (docs) |
| QA | Meal Planner Production Test 1.0 | Checklist shipped |

**Recent commits on `main`:** meal coverage, taxonomy, planner roadmap, production test checklist.

---

## ⏸️ PAUSED (not cancelled)

| Engine / Feature | Why paused |
|------------------|------------|
| Brain 1.0B | Waits on AI Foundation Phase 2 |
| Journey Engine | Needs Skill Development layer |
| Cookbook Engine | Needs Knowledge + Legacy layers |
| Cookbook Social | After Cookbook Engine |
| Creativity Engine | Needs Reasoning layer |
| Culture Engine | Needs Legacy + Knowledge layers |
| Dinner Party Mode | Needs Experience layer |
| Dinner Club | After Experience layer |
| Experience Engine | Layer 5 of AI Foundation |
| Wine/Bourbon Cellar | Post-foundation feature |

**Rule during freeze:** Bug fixes, P0 production issues, and AI Foundation work only. No new user-facing engines.

---

## What exists today (code skeleton)

| System | Location | Intelligence level |
|--------|----------|-------------------|
| Inventory Engine | `inventory.ts`, Pantry Wizard | Data capture |
| Receipt Engine | `receipts.ts` | Parse + verify |
| Meal Planning | `meals.ts` | Prompt-based (no knowledge graph) |
| Assistant / Clara | `assistant.ts` | Single GPT prompt + pantry list |
| Brain 1.0A | `utils/brain/` | Deterministic memory generator |
| Food Taxonomy | `src/types/foodTaxonomy.ts` | Metadata seed (8 families) |
| Plan review | `MealPlanner.tsx` | Local feedback (not synced) |
| Household Graph | docs only | Not wired to runtime |

**Gap:** No unified knowledge registry, expert orchestration, or decision ledger.

---

## Allowed work during freeze

- ✅ AI Foundation docs + architecture
- ✅ `data/ai/` knowledge registry (structured data)
- ✅ `brainRegistry.ts` expert definitions
- ✅ Decision ledger schema + first writes from plan review
- ✅ P0 bugs (504, auth, onboarding)
- ✅ Production test checklist execution
- ❌ New engines (Journey, Cookbook, Culture, etc.)
- ❌ Dinner Party / Dinner Club UI
- ❌ Brain 1.0B conversational frame (until Phase 2)

---

## Exit criteria (return to feature work)

When **SOUSCHEF AI Foundation** reaches ~**70–80%** of Phase 1–4:

1. **Knowledge Graph** — ingredients, techniques, substitutions queryable
2. **Household Intelligence** — Brain 2.0 reads graph + behavior patterns
3. **Reasoning Engine** — multi-direction meal suggestions (not recipe match)
4. **Learning Engine** — decision ledger feeds confidence updates

Then resume: Brain 1.0B → Journey → Cookbook → Creativity → Culture.

---

*Save point locked. Build the brain.*
