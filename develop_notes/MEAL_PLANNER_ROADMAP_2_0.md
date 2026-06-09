# Meal Planner Roadmap 2.0

**Status:** Living roadmap — partial implementation in progress  
**Date:** June 2026  
**Related:** `MEAL_PLAN_COVERAGE_1_0.md`, Brain 1.0B (not started)

---

## Grades (post-coverage + realism pass)

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Household realism | A- | Leftover lunches, rotating breakfasts, cook-night gaps |
| Cost awareness | B+ | Grocery est. on plan; Pantry Challenge mode next |
| Waste reduction | A | Leftover rule + expiring-item metric (rough) |
| Kitchen intelligence | B+ | Coverage + goals; style override shipping |
| Future Brain readiness | A | Plan review feedback loop foundation |

> The planner is moving from "recipe generator" toward **household operations planning**.

---

## Biggest win so far

> At least half of lunches should be leftovers from prior dinners.

One rule — more money saved and waste prevented than many AI features combined.

---

## Build order

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Plan review screen (Keep / Replace / Why) | 🟡 MVP shipped |
| **P1** | Cooking Style override | 🟡 Shipping |
| **P1** | Cooking Frequency (cook N nights) | 🟡 Shipping |
| **P1** | Three plan metrics | 🟡 Shipping |
| **P2** | Meal tag foundation | 🟡 Types only |
| **P2** | Pantry Challenge Mode | 🔜 Next |
| **P3** | Guests this week | 🔜 Future |
| **P3** | Dinner Party Mode | 🔜 Do not build yet |

---

## 1. Cooking Style (override)

Profile knows cuisines from onboarding. Planner allows **temporary override**:

- Comfort Food · Southern · Cajun/Creole · Italian · Mexican · Asian-Inspired · BBQ & Smoked · Homestead · Meal Prep · Entertaining

Example: *Plan next week as Cajun comfort food.*

Eventually defaults from household profile; override per plan.

---

## 2. Cooking Frequency

Not every family cooks every night.

**Ask:** How many dinners do you want to cook?

- Cook 3 nights · Cook 5 nights · Cook every night

Remaining dinner slots → easy nights:

- Leftovers · Sandwich night · Soup night · Pizza night · Free night

---

## 3. Pantry Challenge Mode (next)

> Chef, let's spend as little as possible this week.

Goals: inventory first · minimize grocery · reduce waste.

Target result:

```txt
Estimated grocery spend: $24
Estimated inventory utilized: $117
```

Gamification — people love winning.

---

## 4. Three metrics (every plan)

Track immediately (rough numbers OK):

| Metric | Clara says |
|--------|------------|
| **Inventory Utilization Score** | This plan uses 63% of your current inventory. |
| **Waste Prevention Score** | This plan should prevent 4 items from expiring. |
| **Estimated Grocery Cost** | Already on plan |

---

## 5. Meal tags (foundation only)

Do not build Dinner Party Mode yet. Tag meals for future Clara:

`Weeknight` · `30 Minutes` · `Crowd Favorite` · `Dinner Party` · `Church Potluck` · `Holiday` · `Leftovers Friendly` · `Freezer Friendly`

See `src/types/mealTags.ts`.

---

## 6. Guests (future)

```txt
Any guests this week?
0 · 1–2 · 3–5 · 6+
```

Dramatically changes portions and menu selection.

---

## 7. Plan review — Brain fuel (P0)

After Clara creates a plan:

```txt
Monday · BBQ Chicken
[Keep]  [Replace]  [Why this?]
```

Every replacement teaches Clara. Every acceptance teaches Clara.  
Feedback loop → Brain 1.0B input.

MVP: local state + Why explains meal; Replace/Keep logged in `plan_data.reviews` for future sync.

---

## Before Brain 1.0B

Ship **plan review** first. Do not start conversational Brain until meal planning feedback loop exists.

---

*Household operations, not recipe roulette.*
