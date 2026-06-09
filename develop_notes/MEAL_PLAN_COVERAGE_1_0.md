# Meal Plan Coverage 1.0

**Status:** Shipped in meal planner UI + `meals` function  
**Related:** `netlify/functions/meals.ts`, `src/pages/MealPlanner.tsx`, `src/types/mealPlanCoverage.ts`

---

## Problem

7-day meal plans were auto-generated as **dinner-only** (`dinnersOnly = days >= 4` in backend). Chefs who wanted full-day coverage had no way to say so.

---

## Required flow

1. **Plan length** — 3, 5, 7, or 14 days  
2. **Meal coverage** — What should I plan for?  
   - Dinners only *(default)*  
   - Breakfast + dinner  
   - Lunch + dinner  
   - Breakfast + lunch + dinner  
   - Custom (steppers for breakfasts, lunches, dinners, snacks)  
3. **Household size** — default from profile, editable  
4. **Planning goal** — save money, use inventory, quick, healthy, family, variety, kid-friendly  
5. **Generate** — prompt includes explicit meal counts  

---

## UX default

> **Planning: 7 dinners**  
> Add breakfasts or lunches?

Defaults to dinners only; one tap expands coverage without forcing detail.

---

## Acceptance

- [x] 7-day plan does not automatically mean dinner-only without Chef choosing it  
- [x] OpenAI prompt includes meal counts per chunk  
- [x] UI shows `Planning: 7 dinners` or full coverage summary  
- [x] Kitchen Supply Plan derives from generated meals  
- [x] Coverage metadata stored on `plan_data.coverage`  
- [x] Full-day warning: "Full-day plans take a little longer…"  
- [x] Heavy plans (>12 meals) split by meal type to control token cost  
- [x] Supply list grouped: Breakfast · Lunch · Dinner · Shared staples  
- [x] Realism prompt: rotating breakfasts, leftover lunches, varied dinners (unless Variety goal)  
- [x] Generated plan shows **Planned for N people** prominently  

---

## Manual test matrix

| Scenario | Expected |
|----------|----------|
| 7 dinners | 7 dinner entries, dinner-grouped supply |
| 7 breakfasts + 7 dinners | Rotating breakfasts, varied dinners |
| 7 B + 7 L + 7 D | Full-day warning, grouped supply, leftover lunches |
| Custom 3B / 5L / 7D / 2 snacks | Counts honored in prompt |

---

## Backend notes

- Removed `dinnersOnly = days >= 4` auto rule  
- Chunk size scales down when meals/day is high  
- `totalMeals > 12`: separate API calls for breakfasts, lunches, snacks; dinners chunked by 3 days  
- `supply_group` on shopping items; cross-meal items promoted to `staple`  
- `planning_goal=variety` disables repetition defaults  

---

*Meal length ≠ meal coverage. Always ask.*
