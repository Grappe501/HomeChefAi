# Competitive Positioning 1.0

**Status:** Strategy documentation  
**Date:** June 2026  
**Related:** `MARKETING_REBUILD_1_0.md`, `PRICING_STRATEGY_1_0.md`

---

## Market landscape

### Tier 1 — Commodity (we do NOT compete here)

| Competitor | Category | Their moat | Our response |
|------------|----------|------------|--------------|
| **AnyList, Paprika** | List/recipe apps | Simplicity, price | Don't compare — different category |
| **Mealime, Eat This Much** | Meal planners | Recipe database size | We sell intelligence, not recipes |
| **NYT Cooking, AllRecipes** | Recipe media | Content library | We sell *your* family's food story |
| **Instacart, Walmart app** | Grocery logistics | Delivery | We complement, not replace |

### Tier 2 — Adjacent (partial overlap)

| Competitor | Overlap | We win when... |
|------------|---------|----------------|
| **Samsung Food / Whisk** | Pantry + recipes | User wants family memory, not ads |
| **Yummly** | Recommendations | User wants explainable Brain, not black box |
| **PlateJoy, Factor** | Meal kits/plans | User cooks at home, not pre-made |
| **Notion/home spreadsheets** | DIY tracking | User wants zero setup + AI |

### Tier 3 — Aspirational peers (future category)

| Competitor | What they do well | What we do differently |
|------------|-------------------|------------------------|
| **Noom** | Behavior change UX | Food-specific, not weight-only |
| **Ancestry** | Longitudinal memory | Applied to food culture, not DNA |
| **Strava** | Social + personal progress | Kitchen Cred, Plate Score — contribution not vanity |

**No direct competitor** owns "Household Food OS + Brain + Culture Memory." That's the white space.

---

## Category we own (target)

```
Household Food Operating System
        +
Kitchen Intelligence Platform
        +
Family Food Companion
```

**Not:** meal planner. **Not:** recipe app. **Not:** grocery delivery.

---

## Why we win — six moats

### 1. Longitudinal household intelligence

| Them | Us |
|------|-----|
| Snapshot: "what's in pantry today" | Timeline: "you buy milk every 7 days" |
| One-shot AI prompt | Brain learns over months |
| Individual user | Whole household |

**Moat depth:** The **Household Food Graph** — proprietary nodes and edges accumulated over time. See `HOUSEHOLD_FOOD_GRAPH_1_0.md`. Switching cost rises with every week of use.

### 2. Family-first architecture

- Cook Together households
- Family preference graph (future)
- Per-person likes/dislikes
- Dinner clubs as social unit

Competitors are **single-user apps** with sharing bolted on.

### 3. Recipe ownership and lineage

| Them | Us |
|------|-----|
| "Chicken Gumbo #442" | "Steve Grappe's Saturday Gumbo" |
| Anonymous ratings | Plate Score + I Tried It + variation forks |
| Copy recipe | Fork with co-author credit |

**Legal + product:** See `TERMS_FRAMEWORK_1_0.md`.

### 4. Experience engine (future)

Nobody helps you **host**:

- Dinner party timelines
- Wine pairing
- Dinner club rotation
- Potluck coordination

Meal planners stop at the recipe list. We plan the **evening**.

### 5. Outcome metrics

| Them market | We market |
|-------------|-----------|
| "10,000 recipes" | "17 home-cooked meals this month" |
| "AI powered" | "$284 saved vs takeout" |
| "Smart suggestions" | "8 lbs waste prevented" |

Success Engine (`household_food_scores`) becomes marketing fuel.

### 6. Price simplicity

| Competitor typical | SousChef |
|--------------------|----------|
| $9.99–$12.99/mo | **$9/mo** Plus |
| $19.99–$29.99 family | **$18/mo** Family |
| Hidden AI upsells | Transparent AI credits |

Clean pricing is a positioning weapon.

---

## Competitive matrix (simplified)

| Capability | Paprika | Mealime | Samsung Food | **SousChef** |
|------------|---------|---------|--------------|--------------|
| Receipt scan | ❌ | ❌ | Partial | ✅ |
| Pantry tracking | Manual | ❌ | Partial | ✅ |
| AI meal plan | ❌ | ✅ | ✅ | ✅ |
| Household sharing | ❌ | ❌ | Partial | ✅ |
| Learns over time | ❌ | ❌ | ❌ | ✅ Brain |
| Recipe ownership | ✅ personal | ❌ | ❌ | ✅ + lineage |
| Dinner clubs | ❌ | ❌ | ❌ | ✅ (Family) |
| Experience hosting | ❌ | ❌ | ❌ | ✅ (future) |
| Culture memory | ❌ | ❌ | ❌ | ✅ (future) |
| **Price** | $5 one-time | ~$6/mo | Free (ads) | Free / **$9** / **$18** |

---

## Positioning statements by competitor

**vs meal planners:**

> "Meal planners tell you what to cook Tuesday. SousChef knows what your family actually eats, buys, wastes, and remembers — every Tuesday."

**vs pantry apps:**

> "Pantry apps count cans. SousChef understands your household."

**vs recipe apps:**

> "Recipes belong to people, not databases. Steve Grappe's gumbo — not Recipe #1027."

**vs DIY (spreadsheets/Notes):**

> "Stop running your kitchen on spreadsheets. One system that learns with you."

---

## Vulnerabilities (honest)

| Risk | Mitigation |
|------|------------|
| OpenAI cost squeeze | Deterministic Brain first; credit system |
| Big tech (Apple Health + food) | Move fast on culture memory + family moat |
| "Good enough" free apps | Outcome metrics + Brain depth |
| Complexity creep | Phased build order; Free tier stays simple |
| Cold start (empty Brain) | Archetype onboarding seeds Day 0 |

---

## Go-to-market wedge (recommended)

**Phase 1 wedge:** Busy families — receipt scan → pantry → dinner answer  
**Phase 2 wedge:** "Your kitchen learns" — Brain insights marketing  
**Phase 3 wedge:** Family cookbook + Plate Score — retention + viral  
**Phase 4 wedge:** Dinner clubs + hosting — Family tier conversion  

**Do not lead with:** AI, GPT, or "smart" — lead with **outcomes**.

---

## Why now

1. Product stable (V3.1 shipped)
2. Brain architecture defined before build
3. Business docs before billing
4. Category still unclaimed
5. AI costs manageable with credit system + deterministic Brain

---

## Summary

**We win by being the only platform that:**

> Understands how your family cooks, learns, shops, grows, improves, creates, hosts, and remembers food over years.

That's not a meal planner. That's a **Household Food OS**.

And nobody else is building it.

---

*Compete on depth and time, not feature checklists.*
