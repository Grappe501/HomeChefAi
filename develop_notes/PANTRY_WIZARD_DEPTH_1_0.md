# Pantry Wizard Depth System 1.0

**Status:** Architecture — Level 1 shipped; L2–L4 future  
**Related:** `PANTRY_WIZARD_UNITS_1_0.md`, `HOUSEHOLD_FOOD_GRAPH_1_0.md`

---

## Principle

> **Never force detail. Always allow detail.**

Three user types, one wizard:

| Level | User | Experience |
|-------|------|------------|
| **1** | Quick Start Chef (~80%) | Generic item + sensible size tap |
| **2** | Organized Chef | Optional subtype (Sharp Cheddar, Whole Milk) |
| **3** | Kitchen Nerd | Optional brand |
| **4** | Expert | Package precision, store, frequency |

---

## Level 1 (shipped)

```
Cheddar Cheese
  [Small]  [Medium]  [Large]
```

```
Oats
  [Small canister]  [Large canister]  [Bulk bag]
```

```
Spaghetti
  [1 box]  [2 boxes]  [3 boxes]
```

Inventory confidence ~75–80%. Onboarding takes minutes.

---

## Level 2 — Type / subtype (future)

After Level 1 selection:

```
Would you like to be more specific?

○ Skip
○ Mild Cheddar
○ Sharp Cheddar
○ Extra Sharp
○ Shredded
○ Block
```

One extra tap. Optional always.

**Already reserved in config:** `subtypes` on Cheese, Milk items in `pantryWizard.ts`.

---

## Level 3 — Brand (future)

```
Brand?

○ Tillamook
○ Cabot
○ Kraft
○ Store Brand
○ Other
```

Brain learns:

> The Grappe Kitchen strongly prefers Tillamook Sharp Cheddar.

---

## Level 4 — Expert detail (future)

```
Approximate amount?
○ Small  ○ Half Package  ○ Full  ○ Multiple

Store preference?
Purchase frequency?
```

---

## Data model (future graph fields)

```txt
item_category      → Grains & Pasta
item_subtype       → Sharp Cheddar
brand_preference   → Tillamook
package_type       → 16 oz block
confidence         → 0.85
```

Brain learns over 90 days:

- Most common subtype
- Most common brand
- Most common package size
- Purchase frequency

---

## Clara value (why this matters)

> Chef, you usually buy Tillamook Sharp Cheddar, but this week's recipe only needs generic cheddar. Save a few dollars?

> Chef, your household almost always buys Duke's Mayonnaise.

> Chef, you appear to prefer Blue Bell vanilla when ice cream is purchased.

That's **household identity** — not "14 oz left."

---

## Settings (future)

```
Kitchen Detail Level

○ Simple      — Level 1 only
○ Standard    — Level 1 + occasional L2 prompts
○ Detailed    — L2 default, L3 offered
○ Chef Mode   — Full depth available
```

Homesteaders and serious cooks opt in. Casual users never see it.

---

## Implementation phases

| Phase | Work |
|-------|------|
| **1.0 (now)** | Unit audit + Level 1 labels |
| **1.1** | L2 subtype picker for Cheese, Milk, Meat |
| **1.2** | Brand memory + Brain preference edges |
| **2.0** | Kitchen Detail Level setting |
| **2.1** | Purchase history → "What I've bought" screen |

---

## Three mental models (future screens)

| Screen | Question |
|--------|----------|
| **Kitchen Inventory** | What do I have? |
| **Kitchen Supply Plan** | What do I need? |
| **Purchase History** | What have I bought? |

Wizard feeds **Inventory**. Receipts feed **Purchase History**. Meal plans feed **Supply Plan**.

---

*Progressive disclosure is a system-wide rule — not just the wizard.*
