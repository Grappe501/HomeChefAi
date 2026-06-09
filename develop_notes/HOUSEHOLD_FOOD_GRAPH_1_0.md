# Household Food Graph 1.0

**Status:** Master intelligence model — documentation only  
**Date:** June 2026  
**Related:** `docs/NORTH_STAR.md`, `BRAND_GUIDE_1_0.md`, Brain 1.0A spec

> **This is the most valuable future asset.** Not the Brain. Not the recipes. Not the social network. Not the AI.
>
> Everything else sits on top of the **Household Food Graph** — a proprietary model of how a household relates to food over years.

---

## What it is

A longitudinal, household-scoped knowledge graph that connects:

- Who cooks, eats, hosts, and learns
- What they buy, store, cook, waste, and preserve
- How skills, traditions, and preferences evolve
- When events, experiences, and gatherings happen
- Why recommendations make sense (explainable edges)

**Internal category:** Household Food Operating System  
**User-facing outcome:** Less stress · more home cooking · preserved traditions

---

## Why it matters

Most food apps optimize:

> What should I cook tonight?

SousChef optimizes:

> How does a household relate to food over years?

The graph is the **defensible moat**. Receipt scanning is table stakes. A proprietary household food graph is not.

| Layer | What it does | Graph role |
|-------|--------------|------------|
| Inventory Engine | Live state | Writes ingredient + shopping nodes |
| Food Brain | Memory + inference | Reads/writes memories, discovers patterns |
| Archetype Engine | Kitchen identity | Labels household + recipe nodes |
| Recommendation Engine | Suggestions | Traverses preferences + inventory edges |
| Journey Engine | Skill growth | Writes technique + skill edges |
| Cookbook Engine | Recipe lineage | Writes recipe + authorship edges |
| Creativity Engine | Transformations | Links leftovers → new dishes |
| Culture Engine | Traditions | Writes tradition + occasion nodes |
| Experience Engine | Hosting | Writes event + guest edges |
| Success Engine | Outcomes | Aggregates graph into metrics |

**Brain, Journey, Cookbook, Creativity, Culture, and Experience are not separate products.** They are different **views and writers** on the same graph.

---

## Graph scope

| Boundary | Rule |
|----------|------|
| **Primary unit** | Household (not individual user) |
| **Individual nodes** | People within household retain identity |
| **Privacy** | Graph is private by default; shared edges require explicit opt-in |
| **Time** | All significant edges are timestamped — longitudinal by design |
| **Confidence** | Edges carry confidence scores; inference never overwrites observation |

---

## Nodes

### Person nodes

| Node type | Description | Brand role |
|-----------|-------------|------------|
| `Person` | Household member | Executive Chef · Sous Chef · Junior Chef |
| `Guest` | Non-member at event | Guest |
| `Creator` | Recipe author | Named creator (e.g. Steve Grappe) |
| `Kitchen` | Household identity | The Grappe Kitchen — optional, Culture Engine |

**Key properties:** `display_name`, `role`, `dietary_restrictions`, `skill_level`, `confidence`, `adventure_level`

---

### Ingredients

| Node type | Description | Source |
|-----------|-------------|--------|
| `Ingredient` | Normalized food item | Receipt lines, inventory, recipes |
| `PantryItem` | Instance in household stock | `inventory_items` |
| `ShoppingItem` | Intended purchase | `grocery_list_items` (Brain 1.0A) |
| `LocalSource` | Farmers market, butcher, garden | `local_food` preferences, receipts |

**Key properties:** `name`, `category`, `location`, `quantity`, `expires_at`, `purchase_price`, `source_store`

---

### Recipes

| Node type | Description | Source |
|-----------|-------------|--------|
| `Recipe` | Instruction set + metadata | `recipes` |
| `Variation` | Fork with lineage | `recipe_variations`, `origin_recipe_id` |
| `Technique` | Reusable skill step | Journey catalog (future) |
| `Meal` | Planned or logged instance | `meal_plans`, cook log |

**Key properties:** `title`, `creator`, `archetype_tags`, `meal_time_tags`, `plate_score`, `origin_recipe_id`

---

### Techniques

| Node type | Description | Source |
|-----------|-------------|--------|
| `Technique` | roux, deglazing, brining | Journey Engine catalog |
| `Skill` | Household mastery level | `skill_learned` memories |
| `FlavorProfile` | Cajun, umami-forward, etc. | Archetype + inference |

**Key properties:** `name`, `difficulty`, `prerequisites`, `demonstrated_count`

---

### Events

| Node type | Description | Source |
|-----------|-------------|--------|
| `CalendarEvent` | Scheduled meal or reminder | `calendar_events` |
| `CookSession` | Live cook together | `cook_together_sessions` |
| `ReceiptEvent` | Shopping trip | `receipts` verify |
| `CookLogEvent` | Meal consumed | usage / cook log |

**Key properties:** `timestamp`, `participants`, `outcome`, `xp_awarded`

---

### Experiences

| Node type | Description | Source |
|-----------|-------------|--------|
| `Experience` | Dinner party, game day, etc. | `experiences` |
| `DinnerClub` | Recurring social unit | `dinner_clubs` |
| `DinnerClubEvent` | Club gathering instance | `dinner_club_events` |
| `Occasion` | Birthday, holiday, reunion | `occasion` memory type |

**Key properties:** `experience_type`, `guest_count`, `menu`, `timeline`, `wine_plan`

---

### Traditions

| Node type | Description | Source |
|-----------|-------------|--------|
| `Tradition` | Recurring cultural pattern | `tradition` memories |
| `RecipeStory` | Narrative attached to recipe | Cookbook (future) |
| `HolidayPattern` | Seasonal behavior | Culture Engine inference |
| `FamilyPreference` | Household-wide taste | `family_preference` memories |

**Key properties:** `name`, `frequency`, `participants`, `linked_recipes`, `story_text`

---

## Relationships (edges)

Edges are **directed**, **timestamped**, and optionally **weighted** (strength/confidence).

### Preference edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `LIKES` | Person → Ingredient/Recipe/Technique | Positive preference | Kelly likes mild spice |
| `DISLIKES` | Person → Ingredient/Recipe | Avoidance | Steve dislikes cilantro |
| `PREFERS` | Household → Archetype/Flavor | Kitchen identity | Southern/Cajun weighted 0.7 |
| `ALLERGIC_TO` | Person → Ingredient | Hard constraint | Peanut allergy |
| `DIETARY` | Person → Tag | vegetarian, gluten-free | Guest at dinner party |

---

### Activity edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `COOKS` | Person → Recipe/Meal | Authored or executed | Steve cooked Saturday Gumbo |
| `SHARES` | Person → Recipe | Published to household/community | Kelly shared Mild Gumbo variation |
| `TEACHES` | Person → Person + Technique | Skill transfer | Grandpa taught roux |
| `LEARNS` | Person → Technique | Skill acquisition | Kelly learned deglazing |
| `TRIES` | Person → Recipe | I Tried It | Plate Score contribution |
| `FORKS` | Variation → Recipe | Lineage | Kelly's Mild Gumbo → Steve's Gumbo |
| `CO_AUTHORS` | Person → Variation | Shared credit | Co-authorship on fork |

---

### Inventory edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `OWNS` | Household → PantryItem | Current stock | 2 gal milk in fridge |
| `PURCHASED` | ReceiptEvent → Ingredient | Shopping history | Bought milk at Kroger |
| `CONSUMES` | CookLogEvent → PantryItem | Subtraction | Used 1 cup milk |
| `USES` | Recipe → Ingredient | Recipe dependency | Gumbo needs andouille |
| `SUBSTITUTES` | Recipe → Ingredient | Swap logic | Bell pepper for poblano |
| `EXPIRES` | PantryItem → timestamp | Spoilage risk | Spinach expires Thursday |

---

### Behavioral edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `WASTES` | Household → Ingredient | Spoilage/disposal | 1 lb chicken wasted |
| `SAVES` | Household → Metric | Waste prevented | 8 lbs saved this month |
| `SPENDS` | ReceiptEvent → amount | Shopping spend | $142 at grocery |
| `IMPROVES` | Person → Technique | Skill progression | Beginner → intermediate roux |
| `REPEATS` | Household → Recipe | Habit loop | Tacos every Tuesday |
| `RECOMMENDS` | Brain → Recipe/Meal | Inference output | Tonight: Cajun pasta — why attached |

---

### Social edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `MEMBER_OF` | Person → Household | Membership with role: executive_chef, sous_chef, junior_chef |
| `HOSTS` | Person → Experience | Hospitality | Steve hosts dinner party |
| `INVITES` | Experience → Guest | Guest list | 6 guests Saturday |
| `CONTRIBUTES` | Person → DinnerClubEvent | Potluck item | Kelly brings wine |
| `ROTATES` | DinnerClub → Person | Host rotation | Steve's turn this month |

---

### Temporal edges

| Edge | From → To | Meaning | Example |
|------|-----------|---------|---------|
| `PRECEDES` | Event → Event | Sequence | Shop Sunday → cook Tuesday |
| `TRIGGERS` | Event → Memory | Memory generation | Receipt verify → consumption memory |
| `OCCURS_ON` | Tradition → Calendar | Seasonal | Gumbo every Mardi Gras |
| `EVOLVED_FROM` | Preference → Preference | Taste drift | Spice tolerance increased over 2 years |

---

## Memory types

Memories are **derived graph annotations** — compact, human-readable facts extracted from edges and events. Stored in `household_memories` (Brain 1.0A).

### Core memories (Brain 1.0A)

| Type | What it captures | Example | Trigger events |
|------|------------------|---------|----------------|
| `preference` | Individual taste | "Steve prefers bold spice" | Cook log, explicit feedback |
| `consumption` | Usage patterns | "Milk every 7 days" | Receipt verify, cook log, inventory delta |
| `waste` | Loss patterns | "Spinach often expires unused" | Inventory delete, spoilage mark |
| `habit` | Recurring behavior | "Tacos most Tuesdays" | Cook log frequency |
| `shopping` | Purchase patterns | "Shops at Kroger Sundays" | Receipt verify |

### Family & culture memories

| Type | What it captures | Example | Engine |
|------|------------------|---------|--------|
| `family_preference` | Household-wide taste | "Family prefers mild heat" | Brain inference |
| `tradition` | Recurring cultural pattern | "Gumbo every Mardi Gras" | Culture Engine |
| `local_food` | Sourcing preference | "Buys eggs at farmers market" | Receipt + onboarding |
| `skill_learned` | Technique acquired | "Kelly learned roux" | Journey Engine |

### Experience memories (future)

| Type | What it captures | Example | Engine |
|------|------------------|---------|--------|
| `experience` | Hosted occasion | "Hosted 8-guest dinner party" | Experience Engine |
| `occasion` | Special date | "Anniversary dinner tradition" | Culture + Experience |
| `dinner_club` | Club pattern | "Rotates monthly, Italian theme" | Dinner Club |
| `wine_pairing` | Beverage preference | "Prefers Napa Cab with steak" | Wine & Cellar |

---

## Memory lifecycle

```
Event occurs (receipt verify, cook log, etc.)
        ↓
Edge written to graph (raw observation)
        ↓
Memory generator evaluates (deterministic rules first)
        ↓
Memory created or updated (household_memories)
        ↓
Inference layer reads memories + edges
        ↓
Insight surfaced (Brain UI, recommendations, nudges)
        ↓
Success Engine aggregates outcomes
```

### Rules

1. **Observation before inference** — never invent memories without source events
2. **Confidence decays** — old preferences weighted less unless reinforced
3. **Contradictions resolve** — newer observation wins; log the change
4. **Household scope** — memories belong to household, visible per member permissions
5. **Explainability** — every insight links to source memory or edge

---

## Engine → graph mapping

| Engine | Reads | Writes |
|--------|-------|--------|
| **Inventory** | PantryItem, Ingredient | OWNS, PURCHASED, CONSUMES, EXPIRES |
| **Brain 1.0A** | All memories, consumption edges | preference, consumption, waste, habit, shopping memories |
| **Archetype** | PREFERS, COOKS, archetype_tags | Kitchen identity weights on Household |
| **Brain 1.0B / Recommendations** | LIKES, OWNS, EXPIRES, PREFERS | RECOMMENDS edges with why |
| **Journey** | IMPROVES, LEARNS | Technique nodes, skill_learned memories |
| **Cookbook** | COOKS, SHARES, FORKS | Recipe, Variation, CO_AUTHORS |
| **Creativity** | OWNS (leftovers), USES | Leftover → new Recipe edges |
| **Culture** | OCCURS_ON, tradition | Tradition nodes, tradition memories |
| **Experience** | HOSTS, INVITES, CONTRIBUTES | Experience, Guest nodes |
| **Success Engine** | SAVES, SPENDS, COOKS aggregates | household_food_scores snapshots |

---

## Schema alignment (existing + Brain 1.0A)

### Live today

| Graph concept | Table |
|---------------|-------|
| Person | `profiles`, `household_members` |
| Household | `households` |
| PantryItem | `inventory_items` |
| ReceiptEvent | `receipts` |
| Recipe | `recipes` |
| Variation | `recipe_variations` |
| Meal | `meal_plans` |
| CalendarEvent | `calendar_events` |
| CookSession | `cook_together_sessions` |
| Experience | `experiences`, `dinner_clubs`, `dinner_club_events` |
| Outcome metrics | `household_food_scores` |
| Preferences (profile) | `culinary_profile`, `food_priorities` |

### Brain 1.0A adds

| Graph concept | Table |
|---------------|-------|
| Memory | `household_memories` |
| Consumption cycle | `consumption_cycles` |
| Waste event | `waste_events` |
| ShoppingItem | `grocery_list_items` |
| Recommendation history | `recommendation_history` |

### Reserved in types

`MemoryType` in `src/types/platform.ts` — aligned with memory types above.

---

## Graph queries (future examples)

These are **conceptual** — implementation in Brain 1.0A/B:

```
"What can we cook tonight?"
  → traverse OWNS (pantry) + LIKES/PREFERS (household) + EXPIRES (urgency)
  → rank recipes by match + urgency + time budget

"Who taught Kelly roux?"
  → traverse TEACHES + LEARNS edges on Technique node

"What does this household waste most?"
  → aggregate WASTES edges by Ingredient, last 90 days

"What's Steve Grappe's recipe lineage?"
  → traverse FORKS from Recipe node, follow origin_recipe_id chain

"Plan dinner party for 8"
  → traverse HOSTS history + Guest DIETARY edges + OWNS + PREFERS + wine_pairing memories
```

---

## Competitive moat (graph-specific)

| Competitor has | We have |
|----------------|---------|
| Recipe database | Household-specific graph |
| One-shot AI prompt | Months of edges + memories |
| Individual preferences | Family preference graph |
| Anonymous ratings | Authored recipe lineage |
| Shopping list | Purchase → consumption → waste loop |

**Switching cost:** Every week of use adds nodes and edges. Leaving means losing the household's food history.

---

## Implementation principles

1. **Graph-first thinking** — every new feature asks: what nodes and edges does this create?
2. **Deterministic before LLM** — memory generator uses rules; LLM for language, not truth
3. **Household as tenant** — RLS scopes all graph data to household
4. **Explain every inference** — "because milk every 7 days" not "AI says so"
5. **Don't duplicate** — one memory system, many engine writers
6. **Version the graph** — schema migrations additive; never delete edge history

---

## Brain 1.0A scope (graph MVP)

First graph capabilities to ship:

| Capability | Graph output |
|------------|--------------|
| Receipt verify hook | PURCHASED edges, consumption memories |
| Cook log hook | CONSUMES edges, habit memories |
| Inventory delete hook | WASTES edges, waste memories |
| Memory generator | 5 core memory types |
| `/brain` insights | Human-readable graph traversals |
| Grocery list items | ShoppingItem nodes from inference |

**Not in 1.0A:** Journey, Cookbook social, Experience, Culture — but graph schema accommodates them.

---

## Document hierarchy

```
HOUSEHOLD_FOOD_GRAPH_1_0.md     ← Master model (this doc)
        ↑
docs/NORTH_STAR.md              ← Product vision, engine stack
        ↑
Brain 1.0A spec                 ← First graph writer/reader
        ↑
develop_notes/*                 ← Business, brand, pricing
```

Every future engine spec should reference this document and declare its nodes, edges, and memory types.

---

## Locked decisions

| Decision | Value |
|----------|-------|
| Primary asset | Household Food Graph |
| Graph scope | Household-tenant, longitudinal |
| Memory storage | `household_memories` + typed edges in relational tables |
| Inference | Deterministic first, LLM for prose |
| All engines | Views/writers on same graph — not separate silos |

---

*Brain is the first intelligence layer. The graph is the asset. Everything else is interface.*
