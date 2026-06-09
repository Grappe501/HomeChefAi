# Meal Planner — Production Test Checklist 1.0

**Environment:** https://home-chef-ai.netlify.app/meals  
**Date:** June 2026  
**Related:** `MEAL_PLAN_COVERAGE_1_0.md`, `MEAL_PLANNER_ROADMAP_2_0.md`

Use a **logged-in account** with some pantry items (run Pantry Wizard first if empty).  
Each scenario: wait for plan to finish (full-day plans may take 20–30s).  
Record pass/fail and notes in the table at the bottom.

---

## Pre-flight (once)

- [ ] App loads `/meals` without console errors
- [ ] Profile has `household_size` set (onboarding or settings)
- [ ] Pantry has ≥10 items (wizard or manual add)
- [ ] `meals` API returns 201 (not 504) on a **3-day dinners only** smoke test

---

## Scenario A — 7 dinners only (baseline)

**Setup**

| Control | Value |
|---------|-------|
| Days | 7 |
| Coverage | Dinners only |
| People | Profile default (note the number) |
| Cook nights | Every night (7) |
| Style | From my profile |
| Goal | Use what we have |

**Verify**

- [ ] Summary shows `Planning: 7 dinners` and `Planned for N people`
- [ ] No full-day warning
- [ ] Plan title like `7-Day Plan · 7 dinners`
- [ ] **Planned for N people** prominent on result
- [ ] Exactly **7 dinner** entries (no stray breakfast/lunch)
- [ ] **Clara's Notes:** inventory % and grocery est. shown
- [ ] Kitchen Supply Plan appears (grouped or flat)
- [ ] **Keep / Replace / Why this?** work on at least one meal
- [ ] No 504 in Network tab (`meals` completes in &lt;30s)

---

## Scenario B — 7 breakfasts + 7 dinners

**Setup**

| Control | Value |
|---------|-------|
| Days | 7 |
| Coverage | Breakfast + dinner |
| Cook nights | Every night |
| Style | **Cajun / Creole** (override) |
| Goal | Use what we have |

**Verify**

- [ ] Summary: `Planning: 7 breakfasts, 7 dinners`
- [ ] 7 breakfasts + 7 dinners in plan (14 meals total)
- [ ] Breakfasts **repeat** (not 7 totally unique — oatmeal/eggs/toast rotation OK)
- [ ] Dinners show **Cajun/Southern leaning** names or descriptions
- [ ] Cooking style override reflected (not generic only)
- [ ] Supply list grouped: **Breakfast** · **Dinner** · **Shared staples** (if tagged)
- [ ] Metrics: utilization % &gt; 0 if pantry was used

---

## Scenario C — Full week (7 B + 7 L + 7 D)

**Setup**

| Control | Value |
|---------|-------|
| Days | 7 |
| Coverage | Breakfast + lunch + dinner |
| Cook nights | **Cook 5 nights** (2 easy nights) |
| Style | Comfort Food |
| Goal | Save money |

**Verify**

- [ ] Warning: *"Full-day plans take a little longer…"*
- [ ] 21 meals total (7 each type)
- [ ] **≥ half of lunches** start with "Leftover" or reference prior dinner
- [ ] **2 dinner slots** are easy nights (Sandwich night, Pizza night, Free night, etc.) — may have `easy_night` tag
- [ ] Breakfasts rotate (2–4 patterns)
- [ ] Supply plan has **Breakfast / Lunch / Dinner / Shared staples** sections
- [ ] `meals` request completes without 504
- [ ] Expiring-items line in Clara's Notes (if any items expire within 7 days in pantry)

---

## Scenario D — Custom coverage

**Setup**

| Control | Value |
|---------|-------|
| Days | 7 |
| Coverage | **Custom** |
| Breakfasts | 3 |
| Lunches | 5 |
| Dinners | 7 |
| Snacks | 2 |
| Cook nights | Cook 3 nights |
| Goal | **Pantry challenge** |

**Verify**

- [ ] Button label reflects custom counts
- [ ] Plan has **3 + 5 + 7 + 2 = 17** meals (approx — AI should not wildly exceed)
- [ ] 3 cook nights + 4 easy dinner nights
- [ ] Pantry challenge: heavy `uses_inventory`, lower grocery est. when pantry is stocked
- [ ] Metrics grocery est. shown

---

## Scenario E — Plan review (Brain fuel)

Run after any plan above.

- [ ] Tap **Why this?** on a leftover lunch → toast with explanation
- [ ] Tap **Keep** on a dinner → toast "Clara notes what works"
- [ ] Tap **Replace** on another meal → toast "Replace noted"
- [ ] Selected buttons show selected state
- [ ] Refresh page → reviews may reset (persist not shipped yet — expected)

---

## Scenario F — Cooking frequency edge

| Days | Dinners | Cook nights option | Expected |
|------|---------|-------------------|----------|
| 3 | 3 | Cook 3 / Every night | Both shown |
| 5 | 5 | Cook 3 / Cook 5 / Every | Three buttons |
| 7 | 7 | Cook 3 / Cook 5 / Every night (7) | Three buttons |

- [ ] Cook 3 on 7-day plan → 4 easy-night dinners in output

---

## Scenario G — Household size

- [ ] Change people to **4** before planning
- [ ] Result shows **Planned for 4 people**
- [ ] Ingredient quantities feel scaled (subjective — note if obviously single-portion)

---

## Failure log

| Scenario | Pass? | Notes | Screenshot? |
|----------|-------|-------|-------------|
| Pre-flight | | | |
| A — 7 dinners | | | |
| B — B+D Cajun | | | |
| C — Full week | | | |
| D — Custom | | | |
| E — Review | | | |
| F — Cook nights | | | |
| G — People | | | |

---

## Known limitations (expected)

- Plan review (`Keep`/`Replace`) is **session-local** until Brain sync ships
- Metric scores are **rough estimates**, not receipt-grade
- AI may occasionally miscount meals — note if &gt;1 meal off
- 504 on very heavy plans → retry dinners-only or fewer days

---

## Quick Network debug

1. DevTools → **Network** → filter `meals`
2. POST should be **201** with `{ plan, xp_gained }`
3. Response `plan_data` should include `coverage`, `metrics`, `meals[]`
4. Timeout ~30s = Netlify limit — reduce coverage if hit

---

*Pass all of A–D before treating meal planning as launch-stable.*
