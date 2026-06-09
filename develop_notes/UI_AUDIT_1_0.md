# UI Audit 1.0

**Date:** June 2026  
**Purpose:** Grade every major screen before Brain 1.0B or paid launch  
**Method:** Code review + design intent vs Brand Freeze 1.0 + Design System 1.1  
**Screenshots:** Capture manually on production after deploy — checklist below

> **Rule:** Fix lowest-scoring screens before adding major capabilities. Polish and coherence now matter as much as features.

---

## Grading scale

| Score | Meaning |
|-------|---------|
| **A** | Launch-ready · $18/month credible |
| **B** | Good · minor polish needed |
| **C** | Functional · brand/hierarchy gaps |
| **D** | Misaligned · hurts positioning |
| **F** | Broken or blocks core loop |

**Dimensions (each 1–5):**

1. **Brand alignment** — SousChef, Chef, Sous Chef Clara; stainless/copper/black; not recipe-blog  
2. **Clarity** — 5-second test: what's happening, what needs attention, what to do next  
3. **Mobile usability** — 52px targets, thumb reach, wet-hands spacing  
4. **Professional appearance** — command center, not Pinterest  
5. **$18/month readiness** — would a restaurant owner pay for this screen?

**Overall grade** = average of dimensions, letter mapped.

---

## Hierarchy test (product-wide)

**Target model:**

```
Chef
  ↓
Kitchen
  ↓
Clara (Sous Chef)
  ↓
Insights
  ↓
Actions
```

**Old model (retired):** Recipe App → Features → Data

| Screen | Passes hierarchy test? |
|--------|------------------------|
| Dashboard | ✅ Yes (post 1.1 polish) |
| Brain / Clara's Notes | ✅ Yes |
| Assistant | ✅ Yes |
| Pantry | ◐ Partial — data-first, needs kitchen framing |
| Meal Planning | ◐ Partial — supply plan language started |
| Recipes | ❌ No — generic feed app |
| Onboarding | ✅ Yes |
| Login | ✅ Yes |

---

## Screen audits

### 1. Login

**Route:** `/` (unauthenticated)  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 5 | SousChef, headline locked, Inter, stainless |
| Clarity | 4 | Clear signup/signin; value prop one line |
| Mobile usability | 5 | 52px inputs and primary button |
| Professional | 4 | Clean; no emoji chef |
| $18 readiness | 4 | Credible entry; not yet "premium kitchen" |

**Overall: A- (4.4)**

**Fix before launch:** None critical. Optional: subtle kitchen photography or copper mark.

---

### 2. Onboarding

**Route:** `/` (pre-complete)  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 5 | Title + subtitle pattern, steel/copper restraint |
| Clarity | 4 | Step progress clear; many steps (10) — consider fatigue |
| Mobile usability | 5 | tap-item 52px, Continue/Back |
| Professional | 5 | No church-signup beige/orange |
| $18 readiness | 4 | Strong; long flow may feel beta |

**Overall: A- (4.6)**

**Fix before launch:**
- [ ] Verify P0 save path (no infinite Saving…)
- [ ] Consider collapsing optional steps (zip, allergies) into Settings

---

### 3. Dashboard (Kitchen Command Center)

**Route:** `/`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 5 | Chef → Kitchen → Clara → Insights → Actions |
| Clarity | 4 | Kitchen Status + primary CTA; 5-second test mostly passes |
| Mobile usability | 4 | Good tiles; scroll length on small phones |
| Professional | 4 | Command center; Quick Actions still feel secondary-app |
| $18 readiness | 4 | Strongest screen; memory now demonstrable |

**Overall: B+ (4.2)**

**5-second test:**

| Question | Answer on screen? |
|----------|-------------------|
| What's happening in my kitchen? | ✅ Kitchen Status bullets |
| What needs attention? | ✅ Urgent lines (expiring, waste) |
| What should I do next? | ✅ Primary CTA in status card |

**Fix before launch:**
- [ ] Merge duplicate "Use Soon" card into Kitchen Status (avoid redundancy)
- [ ] Empty kitchen: stronger first-run state (illustration optional)
- [ ] Demote Quick Actions below fold on repeat visits *(future)*

---

### 4. Brain → What Clara Has Learned

**Route:** `/brain`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 5 | SousChefMark, Clara language, not "Brain" in UI |
| Clarity | 5 | Empty state with CTAs; evidence on cards |
| Mobile usability | 4 | Cards expandable; sync button small |
| Professional | 5 | Insight + evidence = trust |
| $18 readiness | 5 | Core differentiator visible |

**Overall: A (4.8)**

**Fix before launch:**
- [ ] Route alias `/clara` redirect *(optional)*
- [ ] Nav link to Clara's notes from dashboard only — no bottom nav entry *(intentional)*

---

### 5. Assistant → Sous Chef Clara

**Route:** `/assistant`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 5 | SousChefMark, "Clara says", not "Chat" |
| Clarity | 4 | Quick prompts help; thread can grow long |
| Mobile usability | 5 | 52px input row, voice button |
| Professional | 4 | Bubbles clean; not yet "executive briefing" |
| $18 readiness | 4 | Relationship model strong |

**Overall: A- (4.4)**

**Fix before launch:**
- [ ] Rename nav ✅ Done (`Clara` not `Chef`)
- [ ] Header subtitle in app shell ✅ `Sous Chef Clara`

---

### 6. Pantry (Inventory)

**Route:** `/inventory`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 3 | "Your Pantry" — functional, not kitchen command |
| Clarity | 4 | Location filters clear; no status summary |
| Mobile usability | 4 | +/- buttons; some tight rows |
| Professional | 3 | List app aesthetic |
| $18 readiness | 3 | Works; not differentiated |

**Overall: C+ (3.4)** — **Priority polish target**

**Fix before launch:**
- [x] Reframe header: Kitchen Inventory + summary
- [x] Link back to Kitchen Status
- [ ] Purchase history view *(future — separate mental model)*

---

### 7. Meal Planning + Kitchen Supply Plan

**Route:** `/meals`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 4 | "Kitchen Supply Plan" label; title updated |
| Clarity | 4 | Plan ahead vs right-now split |
| Mobile usability | 4 | tap-item days; voice input |
| Professional | 3 | Green/red ingredient pills feel consumer-app |
| $18 readiness | 3 | Useful; not premium planning |

**Overall: B- (3.6)**

**Fix before launch:**
- [ ] Replace green/red pills with steel/sage semantic badges
- [ ] Standalone Kitchen Supply page *(future)* — not checklist UI
- [ ] Remove "Planning with AI" language ✅ Done

---

### 8. Grocery / Kitchen Supply List

**Route:** Embedded in `/meals` (no dedicated page)  
**Screenshot:** ☐ Capture from meal plan card

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 3 | Renamed to Kitchen Supply Plan; still list UI |
| Clarity | 3 | Basic ul/li |
| Mobile usability | 3 | No check-off interaction |
| Professional | 2 | Checklist = commodity grocery app |
| $18 readiness | 2 | Not yet "Kitchen Supply Planning" |

**Overall: D+ (2.6)** — **Defer dedicated build; document intent**

**Future direction:**

```
Kitchen Supply Plan
  Produce · Dairy · Proteins
  Estimated total · Pantry gaps only
```

Not: ☐ milk ☐ eggs ☐ bread

---

### 9. Recipe Detail / Recipes

**Route:** `/recipes`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 2 | Generic "Recipes" / Community feed |
| Clarity | 2 | No detail page; placeholder empty state |
| Mobile usability | 3 | Adequate cards |
| Professional | 2 | V2 stub — "Share from Cook Log" |
| $18 readiness | 1 | Not shippable as premium feature |

**Overall: D (2.0)** — **Do not market; Cookbook Social future**

**Fix before launch:** Hide from nav or mark beta. No recipe marketing until authorship UI exists.

---

### 10. Receipt Scan

**Route:** `/receipt`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 4 | Functional; AI language removed from UI |
| Clarity | 4 | Clear flow; edit before verify |
| Mobile usability | 4 | Camera/upload; edit targets vary |
| Professional | 4 | Serious tool feel |
| $18 readiness | 4 | Core loop enabler |

**Overall: B+ (4.0)**

---

### 11. Pantry Wizard

**Route:** `/wizard`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 3 | Friendly; tap-to-add |
| Clarity | 5 | Excellent zero-typing UX |
| Mobile usability | 5 | Large tap targets |
| Professional | 3 | Slightly playful copy |
| $18 readiness | 3 | Onboarding tool, not command center |

**Overall: B (3.8)**

---

### 12. Cook Log

**Route:** `/cook` (FAB)  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 3 | "Log a Meal" — fine |
| Clarity | 4 | Inventory update flow clear |
| Mobile usability | 4 | FAB 52px ✅ |
| Professional | 3 | Functional |
| $18 readiness | 3 | Supports Brain loop |

**Overall: B- (3.4)**

---

### 13. Settings

**Route:** `/settings`  
**Screenshot:** ☐ Capture

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brand alignment | 4 | Clean cards |
| Clarity | 4 | Account, household, zip |
| Mobile usability | 4 | Good |
| Professional | 4 | Matches system |
| $18 readiness | 3 | Missing billing/subscription *(expected)* |

**Overall: B (3.8)**

---

### 14. Calendar / Community / Other

| Screen | Overall | Note |
|--------|---------|------|
| Kitchen Calendar | C+ | Functional; not command-center priority |
| Neighbor Swap | C | Community beta |
| Product Journal | B | Founder-only; fine |

---

## Summary scoreboard

| Screen | Grade | Priority |
|--------|-------|----------|
| Login | A- | Maintain |
| Onboarding | A- | Verify P0 save |
| **Dashboard** | **B+** | Merge Use Soon redundancy |
| **Clara's Notes (Brain)** | **A** | Flagship — protect |
| **Assistant (Clara)** | **A-** | Maintain |
| Pantry | **B-** | Maintain |
| Meal Planning | B- | Badge styling |
| Kitchen Supply (embedded) | D+ | Future dedicated page |
| Recipes | — | Hidden until Cookbook Social |
| Receipt Scan | B+ | Maintain |
| Pantry Wizard | B | Maintain |
| Cook Log | B- | Low priority |

**Weakest three:** Recipes · Kitchen Supply UI · Pantry framing  
**Strongest three:** Clara's Notes · Onboarding · Login

---

## Screenshot pack checklist

Capture on **production** (iPhone + Android if possible) after latest deploy:

| # | Screen | File name (suggested) |
|---|--------|------------------------|
| 1 | Login | `01-login.png` |
| 2 | Onboarding (step 1 + allergies) | `02-onboarding.png` |
| 3 | Dashboard (with Brain data) | `03-dashboard.png` |
| 4 | Dashboard (empty kitchen) | `03b-dashboard-empty.png` |
| 5 | What Clara Has Learned | `04-clara-notes.png` |
| 6 | Sous Chef Clara (Assistant) | `05-clara-assistant.png` |
| 7 | Pantry | `06-pantry.png` |
| 8 | Meal Plan + Kitchen Supply Plan | `07-meal-supply.png` |
| 9 | Recipe list | `08-recipes.png` |
| 10 | Receipt scan | `09-receipt.png` |

Store in: `develop_notes/screenshots/ui-audit-1.0/` *(create when captured)*

---

## $18/month readiness — honest assessment

**Question:** Would I believe this software costs $18/month?

| State | Answer |
|-------|--------|
| Dashboard + Clara + Brain with data | **Getting close — yes for early adopters** |
| Dashboard empty / no Brain data | **No — headline is promise not proof** |
| Full app including Recipes feed | **No — weak screens drag perception down** |

**Recommendation:** Lead marketing with Dashboard + Clara screenshots that show **memory with evidence**. Hide or de-emphasize Recipes until Cookbook Social.

---

## Polish sprint (before Brain 1.0B)

Ordered by impact:

1. **Pantry reframe** — kitchen inventory summary header  
2. **Dashboard** — merge Use Soon into Kitchen Status; remove duplicate  
3. **Meal Planning** — replace green/red pills with design tokens  
4. **Recipes** — remove from nav or add "Coming soon" shell  
5. **Screenshot pack** — human capture for marketing + audit record  
6. **Kitchen Supply** — dedicated page *(post-1.0B, pre-billing)*  

---

## Clara test (language audit)

| Location | Before | After (target) | Status |
|----------|--------|----------------|--------|
| Nav bottom | Chef | Clara | ✅ |
| Header subtitle | Sous Chef | Sous Chef Clara | ✅ |
| Brain page title | Kitchen Brain | What Clara Has Learned | ✅ |
| Dashboard section | Clara's Notes | What Clara Has Learned | ✅ |
| Assistant bubbles | — | Clara says | ✅ |
| Receipt toast | Scanning with AI | Scanning receipt… | ✅ |
| Meal planner | Planning with AI | Planning meals… | ✅ |
| Shopping list | Shopping List | Kitchen Supply Plan | ✅ |

**Avoid everywhere:** AI Assistant · Chat · Kitchen Brain (user-facing) · Unlimited AI

---

## Sign-off

| Gate | Status |
|------|--------|
| Hierarchy shift (Chef → Kitchen → Clara) | 🟢 Documented + largely implemented |
| 5-second dashboard test | 🟡 Passes with data; empty state weak |
| Clara naming | 🟢 Implemented |
| Screenshot pack | 🔴 Human capture pending |
| Lowest screens polished | 🔴 Pantry, Recipes, Supply UI remain |

**Next:** Human screenshot pack → fix C/D screens → re-grade → then Brain 1.0B or billing.

---

*UI Audit 1.0 · Polish before pixels multiply.*
