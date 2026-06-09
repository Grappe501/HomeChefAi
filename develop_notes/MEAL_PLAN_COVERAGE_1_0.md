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
- [x] Kitchen Supply Plan derives from generated meals (unchanged merge logic)  
- [x] Coverage metadata stored on `plan_data.coverage`  

---

## Backend notes

- Removed `dinnersOnly = days >= 4` auto rule  
- Chunk size scales down when meals/day is high (1-day chunks for B+L+D)  
- `planning_goal` and `snacks` passed through POST body  

---

*Meal length ≠ meal coverage. Always ask.*
