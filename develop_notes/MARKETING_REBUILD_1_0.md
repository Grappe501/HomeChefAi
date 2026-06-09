# Marketing Rebuild 1.0

**Product:** HomeChef AI · **Persona:** Sous Chef  
**Status:** Documentation only — no UI, no billing  
**Date:** June 2026  
**Related:** `PRICING_STRATEGY_1_0.md`, `COMPETITIVE_POSITIONING_1_0.md`, `docs/NORTH_STAR.md`

---

## The problem

Current marketing (`marketing/index.html`) describes:

```
Pantry Tracking · Meal Planning · Receipt Scanning
```

The product is becoming:

```
Household Food OS · Kitchen Brain · Family Cookbook · Cooking Academy
Dinner Club Platform · Food Culture Memory · Experience Engine
```

**Category mismatch kills conversion.** We must rebuild messaging before Brain 1.0A ships publicly.

---

## Category positioning

### What we are NOT

| Wrong category | Why it fails |
|----------------|--------------|
| Meal planner | Commodity — hundreds exist |
| Grocery app | Instacart, Walmart win on logistics |
| Pantry tracker | Feature, not a product |
| Recipe app | AllRecipes, NYT Cooking own this |

### What we ARE (marketing language)

**Consumer-facing:** SousChef — trusted companion for your kitchen  
**Internal category:** Household Food Operating System  
**Emotional:** Food Brings People Together — Michelin kitchen meets family dining room

**One-liner:**

> SousChef learns how your family cooks, shops, eats, and remembers — then helps you cook more, waste less, and preserve what matters.

---

## Ideal customer profiles (ICPs)

### ICP 1 — The Busy Family Kitchen (Primary)

| Attribute | Detail |
|-----------|--------|
| Household | 3–6 people |
| Pain | "What's for dinner?" every night; food waste; no shared system |
| Motivation | Save money, feed family, reduce stress |
| Tier fit | **Plus ($9/mo)** |
| Hook | Receipt scan → pantry → "what can I make tonight?" |

### ICP 2 — The Home Cook Growing Skills (Secondary)

| Attribute | Detail |
|-----------|--------|
| Profile | Intermediate cook, wants to improve |
| Pain | Same 10 meals on rotation; wants to learn techniques |
| Motivation | Learn more, cook more, family traditions |
| Tier fit | **Plus ($9/mo)** → **Family ($18/mo)** as household grows |
| Hook | Kitchen Journey, learn-while-cooking, Brain insights |

### ICP 3 — The Entertaining Household (Future primary for Family tier)

| Attribute | Detail |
|-----------|--------|
| Profile | Hosts dinner parties, dinner clubs, holidays |
| Pain | Menu planning, timing, wine, coordinating guests |
| Motivation | Create experiences, impress guests, preserve traditions |
| Tier fit | **Family ($18/mo)** |
| Hook | Dinner Party Mode, Dinner Club, wine pairing, Experience Engine |

### ICP 4 — The Legacy Recipe Keeper (Long-term)

| Attribute | Detail |
|-----------|--------|
| Profile | Multi-generational family, handwritten recipes |
| Pain | Recipes scattered, lost when elders pass |
| Motivation | Preserve more — recipes, stories, culture |
| Tier fit | **Family ($18/mo)** |
| Hook | Family Cookbook, recipe stories, variation lineage |

---

## Marketing pillars (outcomes, not features)

Market **results**, not buttons.

| Pillar | Message | Metric we show |
|--------|---------|----------------|
| **Save money** | Waste less. Shop smarter. Skip takeout. | $ saved vs restaurants |
| **Save time** | Know what to cook without the 6pm panic. | Minutes to dinner decision |
| **Cook more** | More home-cooked meals, less defaulting to delivery. | Home-cooked meals/month |
| **Learn more** | Grow as a cook — one technique at a time. | Skills learned |
| **Connect more** | Cook together. Dinner clubs. Family meals. | Meals eaten together |
| **Preserve more** | Your recipes. Your stories. Your traditions. | Family recipes preserved |

**Hero metric (future dashboard marketing):**

> "17 home-cooked meals this month · $284 saved · 8 lbs waste prevented"

Not: "472 recipes available."

---

## Launch messaging framework

### Headline (locked — Brand Freeze 1.0)

```
SousChef

Your Kitchen Has A Memory.
```

Support copy:

> Know what's in your kitchen.  
> Plan meals with confidence.  
> Preserve family recipes.  
> Build better food traditions.

**Why this wins:** Most competitors claim meal planning. Very few can claim **memory**.

Internal category (Household Food OS) — below the fold only.

### CTA hierarchy

| Stage | CTA |
|-------|-----|
| Awareness | "See how SousChef works" |
| Consideration | "Start free — scan your first receipt" |
| Conversion | "Upgrade to Plus — full Kitchen Brain" |
| Expansion | "Bring your whole family — Family plan" |

---

## Page structure (marketing site rebuild)

```
/                     Hero + outcome metrics + 3 pillars
/how-it-works         Receipt → Brain → Cook → Remember (visual flow)
/pricing              Free · Plus $9 · Family $18 (see PRICING_STRATEGY)
/brain                Kitchen Brain explainer (future flagship)
/families             Cook Together, dinner clubs, household
/cookbook             Recipe ownership, lineage, Plate Score (future)
/about                Mission — richer relationship with food
/legal                Terms, AI policy, privacy (see TERMS_FRAMEWORK)
```

---

## Messaging by product layer (map to build)

| Layer | Status | Marketing message |
|-------|--------|-------------------|
| Inventory Engine | Live | "Scan receipts. Know your pantry." |
| Cook Together | Live | "One kitchen. Many cooks." |
| Kitchen Brain | Brain 1.0A next | "SousChef learns your household." |
| Cookbook Social | Future | "Recipes belong to people, not algorithms." |
| Experience Engine | Future | "Plan dinner parties, not just dinners." |
| Cooking Academy | Future | "Learn while you cook." |

**Rule:** Do not market features that aren't live. Tease on roadmap page only.

---

## Competitive differentiation (summary)

See `COMPETITIVE_POSITIONING_1_0.md` for full analysis.

**Why we win:**

1. Longitudinal household intelligence (not one-shot AI)
2. Family-first (households, not individuals)
3. Recipe ownership + lineage (not anonymous feeds)
4. Experience hosting (not just meal lists)
5. Outcome metrics (meals cooked, money saved — not recipe count)

---

## Brand voice

See **`BRAND_GUIDE_1_0.md`** for full identity, relationship model, and voice examples.

### Naming & relationship

| Term | Meaning |
|------|---------|
| **SousChef** | Product — standalone, no tagline on logo |
| **Chef** | How we address the user |
| **Sous Chef** | Assistant role — default Clara, renameable |
| **HomeChef AI** | Legal entity only |

### Engine missions

| Engine | Mission |
|--------|---------|
| Academy | Develop Better Chefs |
| Culture | Preserve Food Traditions |
| Community | Share What Works |

### Voice summary

| Context | Tone |
|---------|------|
| SousChef brand | Professional, competent, calm, precise |
| Sous Chef assistant | Friendly, knowledgeable, prepared, respectful |
| Academy | Teacher, craftsman — "Nice work, Chef." |
| Culture | Storyteller, historian — tradition keeper |
| Experience | Host, curator |

| Do | Don't |
|----|-------|
| Address user as **Chef** | Cute, bubbly, emoji-heavy |
| "Good evening, Chef." | "Hi! I'm your AI buddy!" |
| Celebrate progress with data | "Level 2 unlocked! 🎉" |

---

## Marketing rebuild phases

| Phase | When | Deliverable |
|-------|------|-------------|
| **1.0 (now)** | Pre-Brain 1.0A | These docs + positioning locked |
| **1.1** | After Brain 1.0A | `/brain` marketing page, updated hero |
| **1.2** | After Cookbook Social | Community cookbook messaging |
| **2.0** | Billing launch | Pricing page live, Stripe checkout |
| **2.1** | Experience Engine | Dinner Party / Dinner Club campaigns |

---

## Immediate actions (documentation only)

- [x] Lock positioning and ICPs (this doc)
- [x] Lock pricing tiers at $9 / $18 (see PRICING_STRATEGY)
- [x] Lock AI fair use philosophy (see AI_USAGE_POLICY)
- [x] Lock terms framework (see TERMS_FRAMEWORK)
- [ ] Rebuild `marketing/index.html` — **after Brain 1.0A proves insights**
- [ ] No Stripe, no billing UI until product validated

---

*Marketing follows product truth. Brain 1.0A must work before we sell the Brain.*
