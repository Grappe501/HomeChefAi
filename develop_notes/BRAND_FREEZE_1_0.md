# Brand Freeze 1.0

**Effective:** June 2026  
**Expires:** After Brain 1.0B ships  
**Status:** 🔒 **FROZEN** — no brand, marketing, or design doc changes until then

---

## Declaration

Brand architecture is **complete and locked** for this phase.

No further changes to:

- Brand guide
- Voice hierarchy
- Naming
- Color system
- Typography
- Logo direction
- Marketing messaging
- Design tokens
- Site architecture docs

**Exception:** Bug fixes or clarifications that don't alter locked decisions.

**Resume branding work after:** Brain 1.0B — when memory and recommendations exist to market truthfully.

---

## What is locked

### Product

**SousChef**

Standalone. No AI suffix. No tagline on the logo.

### User

**Chef**

Always. Scales from college student to retired couple to aspiring cook to homesteader.

### Assistant

**Sous Chef**

Default name: Clara. Renameable.

### Core relationship

> The Chef leads. The Sous Chef supports.

Elegant. Professional. Not childish. Not corporate.

---

## The SousChef Promise

Every feature must answer **at least one** of these. If it doesn't, it probably doesn't belong.

| # | Promise |
|---|---------|
| 1 | Help Chef **cook with confidence** |
| 2 | Help Chef **waste less** |
| 3 | Help Chef **save time** |
| 4 | Help Chef **learn** |
| 5 | Help Chef **gather people together** |
| 6 | Help Chef **preserve food traditions** |
| 7 | Help Chef **create memorable experiences** |

Use as a **feature gate** during Brain 1.0A/B and all future engine work.

---

## Product pyramid (internal roadmap)

The stack everybody on the team should understand:

```
                    LEGACY
              Culture Memory
                       │
                  CONNECTION
         Dinner Clubs + Community
                       │
                    GROWTH
    Academy · Creativity · Cookbook + Leftovers + Flavor
                       │
               INTELLIGENCE
        Recommendations (Brain 1.0B)
                       │
                   MEMORY
              Food Brain (Brain 1.0A)
                       │
                 FOUNDATION
              Inventory Engine
```

| Layer | Engines | Brain dependency |
|-------|---------|------------------|
| **Foundation** | Inventory, receipts, cook log | Writes graph edges |
| **Memory** | Brain 1.0A — patterns, insights, grocery intelligence | **First intelligence** |
| **Intelligence** | Brain 1.0B — goal-based recommendations, flavor paths | Requires memory |
| **Growth** | Academy, Creativity, Cookbook, Leftovers | Requires intelligence |
| **Connection** | Dinner Clubs, Community, Cook Together | Requires household graph |
| **Legacy** | Culture Memory, traditions, recipe stories | Requires long-term graph |

Everything above Memory depends on Brain knowing:

- what Chef buys
- what Chef cooks
- what Chef likes
- what Chef wastes
- what Chef repeats
- what Chef values

---

## Marketing headline (locked for rebuild)

**Not A/B candidates anymore.** Strongest message after brand work:

```
SousChef

Your Kitchen Has A Memory.
```

Immediately below:

> Know what's in your kitchen.  
> Plan meals with confidence.  
> Preserve family recipes.  
> Build better food traditions.

**Why this wins:** Most competitors claim meal planning. Very few can claim **memory**.

Internal category language (Household Food OS) stays below the fold — not in the hero.

---

## Kitchen identity (future — not in freeze scope)

The **Kitchen** name may become as important as the household:

- The Grappe Kitchen
- The Johnson Kitchen
- River Bend Kitchen
- Crawse Homestead Kitchen

Already directionally supported in `HOUSEHOLD_FOOD_GRAPH_1_0.md` and onboarding `kitchen_name`. Build during Culture Engine — not before Brain 1.0B.

---

## What happens next (not branding)

| Step | Owner | Status |
|------|-------|--------|
| V3.1 phone smoke test | Human | Pending |
| **Brain 1.0A** | Product | **Next** |
| Brain 1.0B | Product | After 1.0A |
| Marketing site rebuild | Marketing | After Brain proves insights |
| Visual redesign | Design | After Brain 1.0A |
| Brand unfreeze | Brand | After Brain 1.0B |

---

## Freeze rationale

Most startups bounce between features, branding, pricing, and positioning without locking anything.

SousChef now has:

- Product architecture (North Star + Food Graph)
- Business architecture (pricing, AI policy, terms, positioning)
- Brand architecture (guide, design system, logo direction)

**The next value inflection point is Brain 1.0A** — the first thing that makes the product feel intelligent.

Academy, Cookbook, Culture, Experience, and Community all depend on the Brain.

> Now it's time to teach SousChef how to remember.

---

## Document index (frozen)

| Doc | Status |
|-----|--------|
| `BRAND_GUIDE_1_0.md` | 🔒 Locked |
| `DESIGN_SYSTEM_1_0.md` | 🔒 Locked |
| `LOGO_CONCEPTS_1_0.md` | 🔒 Locked |
| `MARKETING_REBUILD_1_0.md` | 🔒 Locked |
| `MARKETING_SITE_ARCHITECTURE_1_0.md` | 🔒 Locked |
| `PRICING_STRATEGY_1_0.md` | 🔒 Locked |
| `AI_USAGE_POLICY_1_0.md` | 🔒 Locked |
| `TERMS_FRAMEWORK_1_0.md` | 🔒 Locked |
| `COMPETITIVE_POSITIONING_1_0.md` | 🔒 Locked |
| `HOUSEHOLD_FOOD_GRAPH_1_0.md` | 🔒 Locked (schema extensions OK during Brain build) |

---

*Brand Freeze 1.0 · June 2026 · Unfreeze after Brain 1.0B*
