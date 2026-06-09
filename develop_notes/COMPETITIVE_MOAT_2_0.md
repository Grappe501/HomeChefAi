# Competitive Moat 2.0

**Status:** Strategy documentation — supersedes `COMPETITIVE_POSITIONING_1_0.md` for investor/GTM use  
**Date:** June 2026  
**Related:** `MARKETING_REBUILD_2_0.md`, `HOUSEHOLD_FOOD_GRAPH_1_0.md`, `docs/BRAIN_1_0A_SPEC.md`

---

## The moat thesis

> **Inventory alone is not the moat.**  
> **Recipes alone are not the moat.**  
> **The moat is memory that compounds.**

SousChef wins when a household's **Household Food Graph** — purchases, cooks, waste, preferences, traditions, lineage — becomes too valuable to abandon.

Switching cost rises every week Chef uses the kitchen.

---

## What competitors have

### Tier 1 — Commodity (do not compete)

| Competitor | Has | Lacks |
|------------|-----|-------|
| **AnyList, Paprika** | Lists, recipes, simplicity | Memory, Brain, household graph |
| **Mealime, Eat This Much** | Meal plans, recipe DB | Longitudinal intelligence, family |
| **NYT Cooking, AllRecipes** | Content library, brand | *Your* family's story |
| **Instacart, Walmart** | Delivery, logistics | Kitchen memory, cooking craft |

### Tier 2 — Adjacent

| Competitor | Has | Lacks |
|------------|-----|-------|
| **Samsung Food / Whisk** | Pantry + recipes + ads | Explainable Brain, ownership model |
| **Yummly** | Recommendations | Evidence, household graph, no black box |
| **PlateJoy** | Personalization | Family architecture, culture memory |
| **Notion / spreadsheets** | Flexibility | Zero setup, receipt → Brain pipeline |

### Tier 3 — Aspirational peers

| Peer | Parallel | SousChef difference |
|------|----------|---------------------|
| **Strava** | Personal progress + social | Kitchen Cred, Plate Score — contribution not vanity |
| **Ancestry** | Longitudinal memory | Applied to food culture, not DNA |
| **Noom** | Behavior change UX | Food-specific, household-scoped |

**No direct competitor** owns: Household Food OS + explainable Brain + recipe lineage + experience hosting.

---

## What SousChef has today (Brain 1.0A)

| Asset | Status | Moat depth |
|-------|--------|------------|
| Receipt → inventory pipeline | ✅ Live | Low alone — replicable |
| Cook log → inventory | ✅ Live | Low alone |
| Cook Together households | ✅ Live | Medium — network in household |
| Brain 1.0A memories | ✅ Live | **Medium — starting to compound** |
| Explainable insights + evidence | ✅ Live | **High — trust differentiation** |
| Household Food Graph schema | ✅ Live | **High — structural** |
| Kitchen identity / named kitchen | ✅ Live | Medium — emotional lock-in |
| Design System 1.1 / SousChef brand | ✅ Live | Medium — professional positioning |
| Deterministic Brain (no LLM cost) | ✅ Live | **High — unit economics** |

---

## The six moats (updated)

### 1. Household Food Graph

**Proprietary nodes and edges accumulated over time.**

```
Purchases → Inventory → Consumption → Waste → Preferences → Traditions → Lineage
```

Every receipt, cook log, and delete writes edges. Competitors start at zero on day one for each user.

**Compounds:** Yes — linearly with data, super-linearly with Brain layers.

See `HOUSEHOLD_FOOD_GRAPH_1_0.md`.

### 2. Longitudinal memory (Brain 1.0A → 1.0B)

| Them | Us |
|------|-----|
| "What's in pantry today" | "You buy milk every 8 days" |
| One-shot ChatGPT prompt | 90 days–24 months of evidence |
| Individual | Whole household |

Brain 1.0A is live. Brain 1.0B adds goal-based recommendations on the same graph — **deeper moat, not a new product**.

### 3. Explainability & trust

Every Brain insight shows:

- Observation count  
- Time window  
- Confidence score  
- Evidence lines  

Black-box AI recommendations are commoditized. **Evidence is not.**

### 4. Kitchen identity & legacy

- Named kitchens ("The Grappe Kitchen")  
- Recipe ownership: `[Name] by [Creator]`  
- Fork lineage with co-authorship *(future)*  
- Culture memory: stories, traditions *(future)*  

Competitors treat recipes as anonymous content objects.

### 5. Family-first architecture

- Household as primary unit  
- Shared pantry, Brain, cook log  
- Dinner clubs as social primitive *(future)*  
- Per-member preferences *(future)*  

Competitors bolt "share" onto single-user apps.

### 6. Unit economics & fair use

- Deterministic Brain = near-zero marginal cost for core intelligence  
- AI credits only on expensive actions  
- Core kitchen never paywalled  
- $9 / $18 clean pricing  

Competitors with "unlimited AI" face margin collapse or bait-and-switch.

---

## Why memory compounds

| Week | User experience | Switching cost |
|------|-----------------|----------------|
| 1 | Pantry + receipt scan | Low |
| 4 | First Brain insights | Medium |
| 12 | Consumption cycles, waste patterns | High |
| 26 | Kitchen identity, named recipes | Very high |
| 52+ | Family traditions, lineage, clubs | **Kitchen legacy** |

**The product gets smarter without the user doing more work** — that's the compounding loop competitors cannot copy with a feature sprint.

---

## Competitive matrix (2026)

| Capability | AnyList | Mealime | Whisk | SousChef |
|------------|---------|---------|-------|----------|
| Pantry tracking | ◐ | ◐ | ● | ● |
| Receipt OCR | ○ | ○ | ◐ | ● |
| Household sharing | ◐ | ○ | ○ | ● |
| Longitudinal Brain | ○ | ○ | ◐ | ● |
| Explainable insights | ○ | ○ | ○ | ● |
| Recipe ownership/lineage | ○ | ○ | ○ | ◐ *(future)* |
| Experience hosting | ○ | ○ | ○ | ◐ *(future)* |
| Clean $9/$18 pricing | ● | ◐ | ○ | ● |
| Core never paywalled | ● | ◐ | ○ | ● |

● Strong · ◐ Partial · ○ Weak/none

---

## GTM wedge (what to sell first)

**Do not lead with:** recipe count, AI buzzwords, meal planner category.

**Lead with:**

1. **"Your Kitchen Has A Memory"** — emotional + differentiated  
2. **Receipt → insight in 2 weeks** — proof loop  
3. **Evidence on every insight** — trust  
4. **$9 for full family kitchen** — price weapon  

**Wedge ICP:** Busy family kitchen (ICP 1) — receipt scan pain is universal, Brain delight is the hook.

---

## Threats & responses

| Threat | Response |
|--------|----------|
| Big Tech adds pantry to voice assistant | Graph depth + household + lineage — not a feature race |
| OpenAI launches meal planner | We own household graph; they own model |
| Incumbent adds "AI insights" | Explainability + months of user data — they start at zero for existing users |
| Price war on meal planners | Don't compete in that category — change the conversation to memory |
| AI cost spike | Deterministic Brain + credit system already built |

---

## Moat maturity by phase

| Phase | Moat strength | What unlocks |
|-------|---------------|--------------|
| **Now (1.0A)** | Emerging | Brain acceptance test, 90-day retention |
| **Brain 1.0B** | Growing | Recommendations prove graph value |
| **Cookbook Social** | Strong | Lineage + attribution network effects |
| **Experience Engine** | Strong | Hosting lock-in for Family tier |
| **Academy + Legacy** | Dominant | Multi-year household graph irreplaceable |

---

## Audit of Competitive Positioning 1.0

| Item | 1.0 | 2.0 |
|------|-----|-----|
| Six moats | ✅ | ✅ Updated with 1.0A live state |
| Matrix | ✅ | ✅ Refreshed |
| Brain 1.0A | Pre-ship | ✅ Shipped status |
| Unit economics moat | Brief | ✅ Expanded |
| Compounding timeline | Missing | ✅ Added |
| Threats | Partial | ✅ Added |

---

*The moat is not a feature. It's time spent in the kitchen.*
