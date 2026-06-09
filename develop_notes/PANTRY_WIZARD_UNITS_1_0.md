# Pantry Wizard Unit Audit 1.0

**Status:** ✅ Implemented — all 82 wizard items configured  
**Code:** `src/types/pantryWizard.ts` · `src/pages/PantryWizard.tsx`  
**Date:** June 2026

---

## Problem

Wizard defaulted to `QUICK_QUANTITIES.default` → `1 each`, `2 each` for most items. Useless for bulk dry goods, pasta, and canned goods.

## Solution

Every wizard item now has:

| Field | Purpose |
|-------|---------|
| `unitCategory` | count · weight · package · volume · produce · spice |
| `packageLabel` | Human package type (can, box, bag…) |
| `defaultUnit` | Default inventory unit |
| `inventoryUnit` | Stored in `inventory_items.unit` |
| `level1Options` | Tap labels with `{ label, quantity, unit }` |

**Coverage:** 82/82 items — zero gaps.

---

## Unit categories

### 1. Count-based (cans, jars, cartons)

| Items | Level 1 options |
|-------|-----------------|
| Canned vegetables (8) | 1 can · 2 cans · 3 cans · 4 cans |
| Canned fruits (4) | 1–3 cans |
| Applesauce | 1–3 jars |

### 2. Weight-based (bulk dry)

| Item | Level 1 options |
|------|-----------------|
| White/Brown Rice | 1 lb · 2 lb · 5 lb · 10 lb |
| Flour | 2 lb · 5 lb · 10 lb bag |
| Sugar | 4 lb · 5 lb · 10 lb bag |
| Brown Sugar | 2 lb · 4 lb bag |
| Quinoa | 1 lb · 2 lb bag |
| Oats | Small canister (18 oz) · Large (42 oz) · Bulk bag (2 lb) |
| Potatoes | 1 lb · 5 lb · 10 lb bag |
| Ground Beef, Chicken | 1–3 lb pack |

### 3. Package-based (pasta, boxes)

| Item | Level 1 options |
|------|-----------------|
| Spaghetti, Penne, Macaroni | 1 box · 2 boxes · 3 boxes |
| Bread Crumbs | 1 canister · 2 canisters |
| Baking Powder/Soda | can/box options |
| Chocolate Chips, Cocoa | bag/container |
| Frozen items | bag/pack options |

### 4. Volume / liquid

| Item | Level 1 options |
|------|-----------------|
| Milk | Half gallon · Full gallon · Quart |
| Oils, vinegar, sauces | 1 bottle · 2 bottles |
| Mayo | 1 jar · 2 jars · 3 jars |
| Heavy cream | 1 pint · 2 pints |

### 5. Produce

| Item | Level 1 options |
|------|-----------------|
| Bananas | 3 · 6 · Bunch (9+) |
| Apples | 3 count · 1 lb bag · 3 lb bag |
| Onions | 1 onion · 3 lb bag |
| Garlic, Lettuce | heads |
| Carrots, Celery | bunches |
| Lemons, Limes | 1 · 3 · 6 |

### 6. Dairy quick sizes

| Item | Level 1 options |
|------|-----------------|
| Cheese | **Small · Medium · Large** (4/8/16 oz) |
| Butter | 1 stick · 2 sticks · 1 lb box |
| Eggs | Half dozen · Dozen · 18 count |
| Yogurt | Single · 4-pack · 6-pack |

---

## Acceptance checklist

- [x] No bulk dry good displays as "1 each"
- [x] No pasta displays as "1 each"
- [x] No canned good uses raw "each" when "can" is natural
- [x] Every item has defaultUnit + unitOptions + packageLabel + inventoryUnit
- [x] User sees friendly labels (e.g. "5 lb bag", not "5 lb" alone where context helps)
- [x] Fallback for unknown items: "1 package" / "2 packages" — never numeric each spam

---

## Wizard UX

1. Tap item → size picker with **full labels**
2. Selected item shows label under name (e.g. "Large canister (42 oz)")
3. Inventory stores `quantity` + `unit` for Brain consumption math

---

## Future

See `PANTRY_WIZARD_DEPTH_1_0.md` for Level 2–4 progressive disclosure (subtype, brand, detail level setting).

---

*Units match how Chefs actually buy food — not database defaults.*
