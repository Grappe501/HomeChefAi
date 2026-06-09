# SousChef AI Foundation 1.0

**Initiative:** `SOUSCHEF-AI-FOUNDATION-1.0`  
**Status:** Architecture — multi-sprint intelligence build  
**Duration:** 4–6 weeks feature freeze  
**Master map:** [AI_ARCHITECTURE_MAP_1_0.md](./AI_ARCHITECTURE_MAP_1_0.md)  
**Save point:** [AI_SAVE_POINT_1_0.md](./AI_SAVE_POINT_1_0.md)

---

## North star

Turn Clara from a **feature assistant** into an **expert kitchen intelligence system** that can reason like:

- Executive chef · Food historian · Nutritionist · Meal planner  
- Homesteader · Dinner host · Budget analyst · Family memory keeper  

**At the same time.** Not via one giant prompt — via orchestrated experts on a shared graph.

---

## The six AI layers

| Layer | Name | Purpose |
|-------|------|---------|
| **1** | Kitchen Knowledge System | Culinary KB — not prompts |
| **2** | Household Intelligence Engine | Brain 2.0 — behavior + identity |
| **3** | Culinary Reasoning Engine | Chef thinking — directions, not matches |
| **4** | Skill Development Engine | Micro-lessons — Journey foundation |
| **5** | Experience Engine Intelligence | Hosting, events, timelines |
| **6** | Legacy Engine | Traditions, recipes, years of memory |

Layers 1–4 are **foundation** (Phases 1–4). Layers 5–6 unlock paused engines.

---

## Layer 1 — Kitchen Knowledge System

Build the culinary equivalent of a legal knowledge database.

### Teach Clara (structured, not prose)

- Cuisines · Ingredients · Substitutions · Flavor compounds  
- Techniques · Cooking science · Nutrition · Food safety  
- Meal prep · Preservation · Fermentation · Smoking · Baking  
- Gardening · Local food systems  

### Example: Paprika node

```text
Paprika
 ├─ sweet · hot · smoked
 ├─ Hungarian · Spanish
 ├─ flavor compounds
 ├─ substitute options
 ├─ regional uses
 ├─ pairings
 └─ recipe affinities
```

**Implementation:** `data/ai/` registry + graph edges. Extends `FOOD_TAXONOMY_1_0` from wizard metadata to full knowledge graph.

**Existing seed:** `src/types/foodTaxonomy.ts`, `FOOD_TAXONOMY_1_0.md`

---

## Layer 2 — Household Intelligence Engine (Brain 2.0)

Move beyond deterministic memories (Brain 1.0A).

### Understand household behavior

- Spending · waste · cooking frequency · leftovers behavior  
- Skill progression · seasonal changes  

### Questions Clara must answer

- What is this family likely to cook?  
- What do they buy but never use?  
- What ingredients are central to their identity?  
- What traditions are emerging?  

**Reads:** Household Food Graph + receipts + usage + plan reviews + decision ledger.  
**Existing seed:** `HOUSEHOLD_FOOD_GRAPH_1_0.md`, `utils/brain/`

---

## Layer 3 — Culinary Reasoning Engine

Where competitors die.

**Not:** You have chicken → chicken soup.

**Instead:**

```text
You have: Chicken, Rice, Butter, Garlic, Heavy cream

Three directions: Southern · Cajun · Italian

Which experience do you want tonight?
```

**Implementation:** Reasoning orchestrator calls Knowledge Layer + Household Layer + expert personas. Replaces flat prompts in `meals.ts` and `assistant.ts` over time.

---

## Layer 4 — Skill Development Engine

Teach like a master chef — micro-lessons, never lectures.

**Not:** Step 4: Cook onions.

**Instead:** Notice translucence — moisture leaving cell walls — foundation of sweetness.

**Unlocks:** Journey Engine (paused). Cook Together gets smarter coaching hooks.

---

## Layer 5 — Experience Engine Intelligence

Dinner parties · potlucks · holidays · dinner clubs · game day · graduations.

Clara as: event planner · hosting coach · menu architect · timeline builder.

**Unlocks:** Dinner Party Mode, Dinner Club, Experience Engine (all paused).

---

## Layer 6 — Legacy Engine

Long-term moat — nobody else builds this.

```text
Grandma Louise's German Potato Salad
Last served: July 4, 2029 · Served 11 times · Rating 9.7 · Tradition age 6 years
```

**Unlocks:** Cookbook Engine, Culture Engine, Cookbook Social.

---

## The three tooling pillars

### 1. AI Knowledge Registry — `data/ai/`

Structured culinary knowledge. See [data/ai/README.md](../data/ai/README.md).

### 2. AI Brain Registry — `brainRegistry.ts`

Specialized expert personas Clara orchestrates. See `netlify/functions/utils/ai/brainRegistry.ts`.

### 3. AI Decision Ledger

Every recommendation stores: **Why · Evidence · Confidence · Outcome · Accepted · Rejected**

**Seed today:** Meal plan Keep / Replace / Why → ledger writes.  
**Future:** All Clara suggestions.

---

## Phased delivery (when AI is "done enough")

Not when perfect — when foundation supports paused engines.

| Phase | Deliverable | ~Completion |
|-------|-------------|-------------|
| **Phase 1** | Knowledge Graph queryable from Clara | 25% |
| **Phase 2** | Household Intelligence (Brain 2.0) | 50% |
| **Phase 3** | Reasoning Engine in meals + assistant | 70% |
| **Phase 4** | Learning Engine (ledger → confidence) | 80% |

At **70–80%**, resume Brain 1.0B, Journey, Cookbook, Creativity, Culture.

---

## Sprint outline (4–6 weeks)

| Sprint | Focus | Outputs |
|--------|-------|---------|
| **S1** | Architecture + Knowledge schema | Map approved, `data/ai/` structure, 20 seed nodes (paprika, roux, chicken…) |
| **S2** | Knowledge ingestion + query API | `knowledge.ts` function, substitution lookup |
| **S3** | Brain Registry + orchestrator shell | Expert routing, no feature UI yet |
| **S4** | Decision ledger + plan review sync | Persist Keep/Replace, evidence schema |
| **S5** | Reasoning in meal planner | Replace chunk prompts with graph-aware reasoning |
| **S6** | Household Intelligence v1 | Brain 2.0 reads ledger + graph, surfaces in `/brain` |

Adjust based on production test results from meal planner checklist.

---

## Single brain rule

**One intelligence core.** No scattered "mini-brains" per feature.

Every future feature plugs into:

```text
Knowledge Registry → Expert Registry → Orchestrator → Decision Ledger → Household Food Graph
```

Features are **views and writers**. Intelligence is **shared**.

---

## Related documents

| Doc | Role |
|-----|------|
| `AI_ARCHITECTURE_MAP_1_0.md` | Technical map — data flow, files, integration points |
| `HOUSEHOLD_FOOD_GRAPH_1_0.md` | Long-term graph model |
| `FOOD_TAXONOMY_1_0.md` | Wizard → graph bridge |
| `docs/BRAIN_1_0A_SPEC.md` | Shipped deterministic brain |
| `MEAL_PLANNER_ROADMAP_2_0.md` | Plan review = ledger seed |

---

*Clara becomes an expert system — not a chatbot with pantry access.*
