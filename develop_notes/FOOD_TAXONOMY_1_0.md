# Food Taxonomy 1.0

**Status:** Architecture audit — documentation only (no schema shipped)  
**Date:** June 2026  
**Assigned after:** Pantry Wizard Units 1.0 (`cbf5586`)  
**Related:** `PANTRY_WIZARD_UNITS_1_0.md`, `PANTRY_WIZARD_DEPTH_1_0.md`, `HOUSEHOLD_FOOD_GRAPH_1_0.md`

---

## Executive summary

The Pantry Wizard now speaks in **human-sized units** (`5 lb bag`, `1 can`, `Large canister`). That fixed inventory accuracy.

The next determinant of how smart Clara becomes is **how well the food hierarchy itself is structured**.

> Right now the wizard is inventory.  
> Soon it becomes identity.

This document defines **Food Taxonomy 1.0** — the canonical hierarchy that powers preference learning, substitution suggestions, recipe expansion, inventory inference, and Clara's memory.

---

## Grades (post Units 1.0)

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Inventory Accuracy | A- | 82 items with sensible units; fallback is `1 package` not `1 each` |
| User Friendliness | A | Tap labels match how people think in a pantry |
| Kitchen Realism | B+ | Wizard still inventory-focused; form/subtype not yet asked |
| Future Brain Readiness | A- | Depth doc + `subtypes` reserved; taxonomy not yet wired |

**Next major audit:** this document → implementation in `src/types/foodTaxonomy.ts`.

---

## Hierarchy model

Every food item resolves through four layers:

```txt
Category     →  Dairy
Family       →  Cheese
Variant      →  Sharp Cheddar
Instance     →  Tillamook · 16 oz block · pantry
```

| Layer | Graph node | Wizard touchpoint | Example |
|-------|------------|-------------------|---------|
| **Category** | `IngredientCategory` | Pantry Wizard section header | Grains & Pasta |
| **Family** | `IngredientFamily` | Level 1 tap label | Cheese |
| **Variant** | `IngredientVariant` | Level 2 subtype / form | Sharp Cheddar · Shredded |
| **Instance** | `PantryItem` | Level 3–4 brand + quantity | Tillamook 16 oz block |

**Rule:** Categories are stable. Families expand slowly. Variants are where intelligence lives. Instances are household-specific.

---

## Core taxonomy trees

### Cheese

```txt
Cheese
 ├─ Cheddar
 │   ├─ Mild
 │   ├─ Sharp
 │   └─ Extra Sharp
 ├─ Swiss
 ├─ Mozzarella
 ├─ Parmesan
 └─ Pepper Jack

Form (orthogonal — ask BEFORE size):
 ○ Shredded   ○ Block   ○ Sliced   ○ Crumbled
```

**Why form first:** Shredded vs block changes recipes far more than Small vs Large.

---

### Rice

```txt
Rice
 ├─ White
 ├─ Jasmine
 ├─ Basmati
 ├─ Brown
 └─ Wild

Wizard today: White Rice, Brown Rice (flat)
Target: single "Rice" family → variant picker
```

---

### Flour

```txt
Flour
 ├─ All Purpose
 ├─ Bread Flour
 ├─ Self Rising
 ├─ Cake Flour
 └─ Whole Wheat

Wizard today: Flour (generic)
Target: variant required for baking confidence
```

---

### Tomatoes

```txt
Tomato
 ├─ Fresh
 ├─ Diced (canned)
 ├─ Sauce (canned)
 ├─ Paste (canned)
 └─ Crushed (canned)

Wizard today: Tomatoes (produce), Diced Tomatoes (canned) — separate flat items
Target: one family; form distinguishes fresh vs canned products
```

---

### Potatoes

```txt
Potato
 ├─ Russet
 ├─ Red
 ├─ Yukon Gold
 └─ Sweet

Wizard today: Potatoes (generic lb bag)
Target: variant picker; sweet potato is a different cooking path
```

---

### Beans

```txt
Beans
 ├─ Black
 ├─ Kidney
 ├─ Pinto
 ├─ Chickpea
 └─ …

Form:
 ○ Dry   ○ Canned   ○ Refried

Wizard today: Black Beans, Kidney Beans, Chickpeas (all canned assumption)
Target: form-first; dry vs canned is a recipe gate
```

---

### Milk

```txt
Milk
 ├─ Whole
 ├─ 2%
 ├─ 1%
 ├─ Skim
 ├─ Lactose Free
 ├─ Almond
 └─ Oat

Already reserved in pantryWizard.ts subtypes
```

---

### Ground beef

```txt
Ground Beef
 ├─ 80/20
 ├─ 85/15
 ├─ 90/10
 └─ 93/7

Fat ratio affects every recipe Clara suggests
```

---

## Form-first items (wizard flow change)

For certain families, **do not ask quantity first**. Ask **form** (or variant) first, then size.

| Family | Step 1 — Form / variant | Step 2 — Size |
|--------|-------------------------|---------------|
| Cheese | Shredded · Block · Sliced | Small · Medium · Large |
| Tomatoes | Fresh · Diced Can · Sauce · Paste · Crushed | lb / count / cans |
| Potatoes | Russet · Red · Yukon Gold · Sweet | 1 lb · 5 lb · 10 lb bag |
| Beans | Dry · Canned · Refried | count / lb |
| Milk | Whole · 2% · Skim · Oat · … | Half gal · Full gal · Quart |
| Ground Beef | Lean ratio | 1 lb · 2 lb · Family pack |

**UX principle:** One extra tap that unlocks recipe intelligence is worth it. Quantity without form is database noise.

---

## Wizard item → taxonomy mapping (82 items)

Current Pantry Wizard items map to taxonomy as follows. Items marked **split** should become variant pickers under a family node.

### Canned Vegetables

| Wizard item | Family | Variant | Notes |
|-------------|--------|---------|-------|
| Sweet Peas | Peas | Canned | |
| Green Beans | Green Beans | Canned | |
| Corn | Corn | Canned | |
| Diced Tomatoes | Tomato | Diced | **split** — see Tomatoes tree |
| Black Beans | Black Beans | Canned | **form-first** |
| Kidney Beans | Kidney Beans | Canned | **form-first** |
| Chickpeas | Chickpeas | Canned | **form-first** |
| Mixed Vegetables | Mixed Vegetables | Frozen/Canned | |

### Canned Fruits

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Peaches | Peaches | Canned |
| Pears | Pears | Canned |
| Pineapple | Pineapple | Canned |
| Fruit Cocktail | Fruit Cocktail | Canned |
| Applesauce | Applesauce | Jar |

### Grains & Pasta

| Wizard item | Family | Variant |
|-------------|--------|---------|
| White Rice | Rice | White | **merge** under Rice |
| Brown Rice | Rice | Brown | **merge** under Rice |
| Spaghetti | Pasta | Spaghetti | |
| Penne | Pasta | Penne | |
| Macaroni | Pasta | Macaroni | |
| Oats | Oats | Rolled/Quick | L2: old-fashioned vs instant |
| Flour | Flour | All Purpose (default) | **variant picker** |
| Bread Crumbs | Bread Crumbs | Plain/Italian | |
| Quinoa | Quinoa | — | |

### Baking

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Sugar | Sugar | Granulated |
| Brown Sugar | Sugar | Brown |
| Baking Powder | Baking Powder | — |
| Baking Soda | Baking Soda | — |
| Vanilla Extract | Vanilla Extract | Pure/Imitation |
| Chocolate Chips | Chocolate Chips | Semi-sweet |
| Cocoa Powder | Cocoa | Natural/Dutch |

### Condiments & Sauces

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Ketchup | Ketchup | — |
| Mustard | Mustard | Yellow/Dijon/Whole grain |
| Mayonnaise | Mayonnaise | — | Brand-heavy (Duke's, Hellmann's) |
| Soy Sauce | Soy Sauce | Regular/Low sodium |
| Hot Sauce | Hot Sauce | — |
| BBQ Sauce | BBQ Sauce | — |
| Olive Oil | Olive Oil | Extra virgin / Regular |
| Vegetable Oil | Vegetable Oil | — |
| Vinegar | Vinegar | White/Apple cider/Balsamic |

### Spices

All 12 wizard spices → `Spice` category, individual family nodes. Low variant depth unless blend (Italian Seasoning).

### Dairy & Eggs

| Wizard item | Family | Variant / form |
|-------------|--------|----------------|
| Milk | Milk | Fat/type — **subtype shipped in config** |
| Eggs | Eggs | Size optional L2 |
| Butter | Butter | Salted/Unsalted |
| Cheese | Cheese | **form-first** + cheddar variants |
| Yogurt | Yogurt | Plain/Greek/Flavored |
| Sour Cream | Sour Cream | — |
| Cream Cheese | Cream Cheese | — |
| Heavy Cream | Heavy Cream | — |

### Fresh Produce

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Bananas | Bananas | — |
| Apples | Apples | Variety optional L2 |
| Onions | Onions | Yellow/Red/White |
| Garlic | Garlic | — |
| Potatoes | Potato | **variant picker** |
| Carrots | Carrots | — |
| Celery | Celery | — |
| Lettuce | Lettuce | Romaine/Iceberg/Spinach mix |
| Tomatoes | Tomato | Fresh — **form-first** |
| Lemons | Lemons | — |
| Limes | Limes | — |

### Meat & Protein

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Chicken Breast | Chicken | Breast |
| Ground Beef | Ground Beef | **lean ratio L2** |
| Bacon | Bacon | Regular/Thick/Turkey |
| Sausage | Sausage | Italian/Breakfast/Brat |
| Deli Meat | Deli Meat | Turkey/Ham/Roast beef |
| Tofu | Tofu | Firm/Extra firm/Silken |

### Frozen

| Wizard item | Family | Variant |
|-------------|--------|---------|
| Frozen Vegetables | Mixed Vegetables | Frozen |
| Frozen Fruit | Mixed Fruit | Frozen |
| Ice Cream | Ice Cream | Flavor optional L3 |
| Frozen Pizza | Pizza | Frozen |
| Frozen Chicken | Chicken | Frozen |
| Frozen Fish | Fish | Frozen |
| Frozen Fries | Fries | Frozen |

---

## Common In My Kitchen

The wizard is inventory-focused today. The next identity layer connects **onboarding cuisine preferences** to **staple inference**.

Onboarding already captures:

```txt
American · Italian · Mexican · Asian · Mediterranean · Indian
Southern/BBQ · Comfort Food · Healthy/Light · Quick & Easy
```

After cuisine selection (or on a later wizard pass), Clara asks one question:

> Chef, most Cajun kitchens keep Tony Chachere's, cayenne, paprika, and filé powder.  
> Do you happen to have any of these?

**One question. One tap. Huge recipe unlock.**

### Cuisine → staple bundles (v1 seed list)

| Cuisine | Common staples (tap any) |
|---------|--------------------------|
| **Southern/BBQ** | Tony Chachere's, Cayenne, Paprika, Filé powder, BBQ rub, White vinegar, Hot sauce |
| **Mexican** | Cumin, Chili powder, Oregano, Chipotle, Black beans, Corn tortillas, Salsa |
| **Italian** | Italian seasoning, Oregano, Basil, Crushed tomatoes, Parmesan, Olive oil |
| **Asian** | Soy sauce, Rice vinegar, Sesame oil, Ginger, Garlic, Rice |
| **Indian** | Cumin, Turmeric, Garam masala, Basmati rice, Lentils, Ghee |
| **Mediterranean** | Olive oil, Lemon, Oregano, Chickpeas, Feta, Olives |
| **American** | Ketchup, Mustard, Mayonnaise, Salt, Black pepper, Vegetable oil |
| **Comfort Food** | Butter, Flour, Chicken stock, Cream, Potatoes, Cheese |
| **Healthy/Light** | Olive oil, Quinoa, Greek yogurt, Leafy greens, Lemon |
| **Quick & Easy** | Pasta, Jarred sauce, Frozen vegetables, Eggs, Rice |

**Rules:**

- Show at most **one bundle per selected cuisine**, post-onboarding or end of wizard.
- Never block inventory save — always skippable.
- Each tap creates a `PantryItem` with `source: cuisine_inference` and low initial confidence (0.6).
- Receipt verification and cook logs raise confidence over time.

---

## Detail levels (SousChef naming)

Renamed from generic "Level 1–4" to brand-aligned kitchen modes. See `PANTRY_WIZARD_DEPTH_1_0.md`.

| Mode | Former | Who | What they see |
|------|--------|-----|---------------|
| **Quick Start** | Level 1 | ~80% of Chefs | Family + size tap only |
| **Home Kitchen** | Level 2 | Normal families | Occasional form/subtype prompts |
| **Enthusiast Kitchen** | Level 3 | Brand-aware cooks | Brand + subtype default |
| **Chef Mode** | Level 4 | Power users | Full detail: package, store, frequency |

Setting lives in profile as `kitchen_detail_level` (future).

---

## Graph integration

### Ingredient node fields (proposed)

```txt
taxonomy_id        → cheese.cheddar.sharp
display_name       → Sharp Cheddar
category           → Dairy
family             → Cheese
variant            → Sharp Cheddar
form               → block | shredded | sliced
brand              → Tillamook (optional)
canonical_unit     → oz
substitution_group → cheese.melting
cuisine_tags       → [american, comfort]
confidence         → 0.85
```

### Edges taxonomy enables

| Edge | Example | Taxonomy role |
|------|---------|---------------|
| `SUBSTITUTES` | Mozzarella ↔ Provolone | Same `substitution_group` |
| `VARIANT_OF` | Sharp Cheddar → Cheddar | Parent family |
| `FORM_OF` | Shredded cheddar → Cheddar | Form dimension |
| `STAPLE_OF` | Tony Chachere's → Southern/BBQ | Cuisine bundle |
| `PREFERS` | Household → Tillamook Sharp | Brand at variant level |
| `USES` | Recipe → Diced tomatoes (canned) | Form-aware recipe deps |

### Clara memory examples (target)

```txt
Chef appears to strongly prefer Tillamook sharp cheddar.

Chef's kitchen usually stocks canned black beans, not dry.

Chef cooks with jasmine rice more often than white rice.

Most Southern kitchens like yours keep cayenne — you might be out.
```

---

## Substitution examples (taxonomy-driven)

| Recipe needs | In pantry | Substitute? | Rule |
|--------------|-----------|-------------|------|
| Sharp cheddar, block | Mild cheddar, block | Yes | Same family + form |
| Sharp cheddar, block | Shredded cheddar | Maybe | Form mismatch — Clara warns |
| Diced tomatoes | Crushed tomatoes | Yes | Same family, different form |
| Jasmine rice | White rice | Yes | Same family, different variant |
| Dry black beans | Canned black beans | Adjust recipe | Form gate — soak time |
| Fresh tomato | Diced canned | Yes, cooked dishes | Form swap with note |

---

## Implementation phases

| Phase | Work | Ships |
|-------|------|-------|
| **1.0 (now)** | This audit + depth level rename | Docs only |
| **1.1** | `src/types/foodTaxonomy.ts` — trees for Cheese, Rice, Flour, Tomato, Potato, Beans | Types + tests |
| **1.2** | Form-first wizard flow for Cheese, Tomatoes, Potatoes, Beans | UI |
| **1.3** | Merge flat rice/flour wizard items into family pickers | Wizard refactor |
| **2.0** | Common In My Kitchen post-onboarding pass | Identity layer |
| **2.1** | Taxonomy IDs on `inventory_items` + receipt normalization | Backend |
| **2.2** | Substitution engine reads `substitution_group` | Clara + meal planner |
| **3.0** | Kitchen Detail Level setting drives prompt depth | Profile setting |

---

## Data model sketch (future)

```typescript
interface FoodTaxonomyNode {
  id: string;                    // 'cheese.cheddar.sharp'
  category: string;
  family: string;
  variant?: string;
  forms?: string[];              // ['block', 'shredded', 'sliced']
  substitutionGroup?: string;
  cuisineTags?: string[];
  parentId?: string;
}

interface PantryItemTaxonomy {
  taxonomy_id: string;
  form?: string;
  brand?: string;
  confidence: number;
  source: 'wizard' | 'receipt' | 'cuisine_inference' | 'manual';
}
```

File target: `src/types/foodTaxonomy.ts`  
Wizard reads taxonomy; `pantryWizard.ts` becomes the **presentation layer** over taxonomy nodes.

---

## Acceptance criteria (Food Taxonomy 1.1)

- [ ] Cheese wizard asks form before size
- [ ] Tomato family covers fresh + all canned forms without duplicate flat items
- [ ] Rice and Flour use variant picker under single family tap
- [ ] Potato variant picker (Russet / Red / Yukon / Sweet)
- [ ] Beans ask dry vs canned before quantity
- [ ] At least 3 cuisine bundles in Common In My Kitchen pilot
- [ ] `inventory_items` can store optional `taxonomy_id` + `form`
- [ ] Brain can emit preference memory from variant + brand co-occurrence

---

## Relationship to prior audits

```txt
PANTRY_WIZARD_UNITS_1_0   →  How much? (human units)     ✅ Shipped
PANTRY_WIZARD_DEPTH_1_0   →  How deep? (progressive)     📋 Architecture
FOOD_TAXONOMY_1_0         →  What is it? (hierarchy)     📋 This doc
HOUSEHOLD_FOOD_GRAPH_1_0  →  Who knows what? (memory)    📋 Master model
```

Units fixed **accuracy**. Taxonomy fixes **intelligence**.

---

*The wizard stops being a database form when Clara knows the difference between shredded sharp cheddar and a can of diced tomatoes.*
