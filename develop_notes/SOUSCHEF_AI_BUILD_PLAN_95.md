# SousChef AI Build Plan — 95% Target

**Initiative:** SOUSCHEF-AI-FOUNDATION-1.0 (execution plan)  
**Status:** Approved direction — phased build  
**Current:** ~8% (architecture + shells)  
**Target:** ~95% intelligence foundation  
**Timeline:** ~14–18 weeks (8 phases, 1.5–2.5 weeks each)  
**Related:** [SOUSCHEF_AI_FOUNDATION_1_0.md](./SOUSCHEF_AI_FOUNDATION_1_0.md) · [AI_ARCHITECTURE_MAP_1_0.md](./AI_ARCHITECTURE_MAP_1_0.md)

---

## What “95%” means

Not perfection. **Every layer runs in production** and Clara routes through **one intelligence core**. The last 5% is polish, scale, and paused *product* UIs (Dinner Club social, Cookbook Social feed, wine cellar).

| Layer | At 95% | In the remaining 5% |
|-------|--------|---------------------|
| **L1 Knowledge** | 250+ nodes, query API, substitutions in planner | Full USDA-scale corpus, auto-ingest receipts→nodes |
| **L2 Household** | Brain 2.0 patterns + graph writes | Predictive “what you’ll cook Tuesday” |
| **L3 Reasoning** | 3-direction flow in chat + meals | Voice-first reasoning, image pantry |
| **L4 Skills** | Micro-lessons in Cook Together + Brain | Full Journey UI, skill trees |
| **L5 Experience** | Hosting coach API + timeline generator | Dinner Party Mode UI, Dinner Club |
| **L6 Legacy** | Recipe/tradition nodes + lineage | Cookbook Social, public feed |

---

## Progress tracker

```text
Now          Phase 1    Phase 2    Phase 3    Phase 4    Phase 5    Phase 6    Phase 7    Phase 8
 8% ────────► 20% ─────► 35% ─────► 50% ─────► 65% ─────► 78% ─────► 88% ─────► 93% ─────► 95%
              Knowledge  Corpus     Orchestr.  Reasoning  Brain 2.0  Learning   Skills     Exp+Legacy
              infra      + merge    + Ledger   Engine     + Graph    loop
```

---

## Phase 0 — Baseline (done)

**Completion: ~8%**

| Done | Not done |
|------|----------|
| AI architecture map, save point, freeze | Runtime knowledge |
| `brainRegistry.ts`, `decisionLedger.ts` shells | Orchestrator |
| Brain 1.0A deterministic memories | Brain 2.0 |
| Meal Planner 2.0 (prompt-based) | Reasoning engine |
| `foodTaxonomy.ts` (8 families) | Full knowledge graph |
| Plan review UI (local only) | Ledger persist |

**Gate:** Meal planner production checklist A–D passing on prod.

---

## Phase 1 — Knowledge infrastructure

**Target: 20% · ~1.5 weeks · Layer 1 foundation**

### Build

| # | Deliverable | Files |
|---|-------------|-------|
| 1.1 | Knowledge loader + validator | `netlify/functions/utils/ai/knowledgeLoader.ts` |
| 1.2 | Read API | `netlify/functions/knowledge.ts` — `GET ?id=` `?q=` `?type=` |
| 1.3 | Node schema types | `src/types/knowledge.ts` |
| 1.4 | 25 seed nodes | `data/ai/` — ingredients (10), techniques (5), cuisines (5), meal_patterns (3), substitutions (2) |
| 1.5 | Taxonomy → knowledge importer script | `scripts/import-taxonomy-to-knowledge.ts` |
| 1.6 | Unit tests for loader + lookup | `tests/knowledge.test.ts` |

### Acceptance

- [ ] `GET /.netlify/functions/knowledge?id=ingredient.paprika` returns node &lt;200ms
- [ ] Substitution lookup: `?substitute=ingredient.paprika` returns ranked options
- [ ] Invalid id returns 404 with helpful message
- [ ] All JSON validates against schema

### Layers touched: **L1** (40% of layer)

---

## Phase 2 — Knowledge corpus + graph edges

**Target: 35% · ~2 weeks · Layer 1 complete**

### Build

| # | Deliverable | Target |
|---|-------------|--------|
| 2.1 | Ingredient nodes | 80+ (all pantry wizard items linked) |
| 2.2 | Technique nodes | 20 (roux, sear, braise, emulsion, ferment…) |
| 2.3 | Cuisine nodes | 10 (matches onboarding + cooking styles) |
| 2.4 | Substitution edges | 50+ high-value pairs |
| 2.5 | Flavor profile nodes | 12 (cajun, italian, comfort, bbq…) |
| 2.6 | Food science snippets | 15 (maillard, gluten, smoke point…) |
| 2.7 | Graph query helpers | `getPairings()`, `getSubstitutes()`, `getCuisineStaples()` |
| 2.8 | Wire taxonomy ids on inventory | Optional `knowledge_id` on items from wizard |

### Acceptance

- [ ] Every `FOOD_TAXONOMY` family has ≥1 knowledge node
- [ ] Clara can cite `ingredient.paprika.smoked` in a test prompt (manual)
- [ ] Cuisine bundle “Cajun staples” returns Tony Chachere's, cayenne, etc. (from cuisine node)
- [ ] 250+ total nodes OR documented generator plan for batch 3

### Layers touched: **L1** (95% of layer)

---

## Phase 3 — Orchestrator + Decision Ledger

**Target: 50% · ~2 weeks · Layers 2–3 shell**

### Build

| # | Deliverable | Files |
|---|-------------|-------|
| 3.1 | Clara orchestrator | `netlify/functions/utils/ai/orchestrator.ts` |
| 3.2 | Intent classifier (rules → later ML) | `classifyIntent(message)` |
| 3.3 | Expert prompt assembly | Load registry + knowledge slices per intent |
| 3.4 | Ledger persistence | Supabase `decision_ledger` table + dev store |
| 3.5 | Plan review sync API | `POST meals` action `review-meal` → ledger |
| 3.6 | Ledger read API | `GET brain?ledger=recent` or `decision-ledger.ts` |
| 3.7 | Structured expert output schema | `{ recommendation, why, evidence[], confidence }` |

### Schema (migration)

```sql
CREATE TABLE decision_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  domain TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  why TEXT,
  evidence JSONB DEFAULT '[]',
  confidence NUMERIC DEFAULT 0.7,
  expert_ids JSONB DEFAULT '[]',
  outcome TEXT DEFAULT 'pending',
  outcome_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Acceptance

- [ ] Keep/Replace on meal plan writes ledger row (survives refresh)
- [ ] Orchestrator returns merged response from 2+ experts in dev test
- [ ] No feature adds raw `Pantry: ${inventoryList}` without orchestrator (lint rule or audit)
- [ ] Evidence array contains knowledge node ids where applicable

### Layers touched: **L2** (25%), **L3** (15%)

---

## Phase 4 — Culinary Reasoning Engine

**Target: 65% · ~2 weeks · Layer 3 complete**

### Build

| # | Deliverable | Where |
|---|-------------|-------|
| 4.1 | `reasoning.ts` — build directions from inventory + graph | `utils/ai/reasoning.ts` |
| 4.2 | **Assistant:** “3 directions” mode before full answer | `assistant.ts` via orchestrator |
| 4.3 | **Meals:** optional `mode=directions` then `mode=plan` | `meals.ts` POST |
| 4.4 | UI: direction picker cards | `MealPlanner.tsx` or `Assistant.tsx` |
| 4.5 | Substitutions from knowledge in planner | Missing ingredient → graph substitute |
| 4.6 | All meal/chat generation logs to ledger | Automatic on POST |

### Example UX

```text
You have: chicken, rice, butter, garlic, cream

○ Southern comfort — creamy chicken & rice
○ Cajun — spiced skillet with roux base
○ Italian — garlic butter risotto style

[Pick one] → full plan or recipe steps
```

### Acceptance

- [ ] Chat demo: inventory → 3 directions (not 1 recipe)
- [ ] Meal plan uses knowledge citations in `why` on review
- [ ] Substitute suggestion uses `data/ai/substitutions/` not GPT guess
- [ ] Production: no regression on 7-dinner plan latency (&lt;30s)

### Layers touched: **L3** (90%)

---

## Phase 5 — Household Intelligence (Brain 2.0)

**Target: 78% · ~2.5 weeks · Layer 2 complete**

### Build

| # | Deliverable | Where |
|---|-------------|-------|
| 5.1 | Graph writer helpers | `utils/ai/graphWriter.ts` — edges from receipts, usage, ledger |
| 5.2 | Pattern detectors | buy-never-use, staple identity, leftover frequency, cook-night rhythm |
| 5.3 | Brain 2.0 memory generator | Extend `memoryGenerator.ts` — reads ledger outcomes |
| 5.4 | Household identity inference | “This kitchen leans Cajun comfort” from style + receipts |
| 5.5 | `/brain` UI v2 | Evidence from graph + ledger, not formula-only |
| 5.6 | Suggestions engine rewrite | `suggestions.ts` → orchestrator + household patterns |
| 5.7 | Profile fields | `kitchen_identity`, `inferred_cooking_style` (optional JSON) |

### Questions Clara must answer (test script)

- [ ] What is this family likely to cook this week?
- [ ] What do they buy but rarely use?
- [ ] What ingredients define this kitchen?
- [ ] What tradition is emerging? (≥3 repeated meals)

### Layers touched: **L2** (90%)

---

## Phase 6 — Learning Engine

**Target: 88% · ~1.5 weeks · Feedback loop closed**

### Build

| # | Deliverable | Where |
|---|-------------|-------|
| 6.1 | Outcome processor | Nightly or on-review: adjust confidence on nodes/experts |
| 6.2 | Accept/reject → preference edges | `PREFERS` / `AVOIDS` on graph |
| 6.3 | Replace meal → re-plan single slot | `POST meals` action `replace-meal` with ledger context |
| 6.4 | “Why this?” uses ledger + knowledge | No hallucinated reasons |
| 6.5 | Clara explains prior rejects | “Last time you replaced pasta night…” |
| 6.6 | Metrics dashboard (internal) | Founder journal or `/brain` debug panel |

### Acceptance

- [ ] 5 Keep + 2 Replace → measurable preference shift in next plan
- [ ] Confidence on repeated accepts increases (logged)
- [ ] Brain insight cites ledger entry id

### Layers touched: **L2** (+5%), **L3** (+5%) — **learning loop live**

---

## Phase 7 — Skill Development Engine

**Target: 93% · ~2 weeks · Layer 4 complete**

### Build

| # | Deliverable | Where |
|---|-------------|-------|
| 7.1 | Technique nodes with micro-lessons | `data/ai/techniques/*.json` — `micro_lesson` field |
| 7.2 | `skills.ts` — lesson picker by technique + skill level | `utils/ai/skills.ts` |
| 7.3 | Cook Together coaching hooks | Surface lesson at step (translucence, roux color…) |
| 7.4 | Brain “Skills Clara noticed” | New memory type `skill_observed` |
| 7.5 | Journey data model (no full UI) | `src/types/journey.ts` + stub table |
| 7.6 | Post-cook skill log | `usage.ts` → optional technique tag |

### Acceptance

- [ ] Cook Together step on onions shows micro-lesson (1–2 sentences)
- [ ] Brain shows “Chef is getting comfortable with roux” after 3 logs
- [ ] Journey UI still hidden — data layer ready

### Layers touched: **L4** (85%)

---

## Phase 8 — Experience + Legacy foundations

**Target: 95% · ~2 weeks · Layers 5–6 foundation**

### Build

| # | Deliverable | Where |
|---|-------------|-------|
| 8.1 | Hosting knowledge pack | `data/ai/hosting/` — potluck, dinner_party, game_day, holiday |
| 8.2 | Experience orchestrator intent | `hosting` experts + timeline builder |
| 8.3 | `POST experience-plan` API | Menu + prep timeline + shopping merge (no social UI) |
| 8.4 | Legacy / tradition nodes | `data/ai/traditions/` + recipe `origin` fields |
| 8.5 | Recipe lineage graph | `recipes.ts` — `origin_recipe_id`, serve count, last_served |
| 8.6 | Legacy memory type | “Grandma Louise's potato salad — served 11 times” |
| 8.7 | Meal tags enforced on generation | `mealTags.ts` wired in orchestrator output |

### Acceptance

- [ ] API: “Plan a dinner party for 8, Italian, 6pm start” → timeline + menu draft
- [ ] Recipe save increments serve count + last_served
- [ ] Brain shows one legacy-style insight from cook history
- [ ] Dinner Party **Mode UI** still flagged paused — API proves layer

### Layers touched: **L5** (80%), **L6** (75%)

---

## After 95% — resume paused product work

Priority order once foundation is solid:

1. **Brain 1.0B** — conversational frame over Brain 2.0 (easy now)
2. **Journey UI** — skill trees use L4 data
3. **Cookbook Engine** — lineage + Legacy layer
4. **Dinner Party Mode UI** — wraps L5 API
5. **Creativity / Culture / Dinner Club** — graph already exists

---

## Cross-cutting rules (every phase)

1. **One brain** — no new feature-specific GPT prompts; extend orchestrator  
2. **Evidence required** — every Clara claim links knowledge id, graph edge, or ledger entry  
3. **Household scoped** — ledger + graph private; knowledge global  
4. **Dev store parity** — every Supabase table works in `USE_DEV_STORE`  
5. **Latency budget** — orchestrator + 1 GPT call default; max 2 for heavy plans  
6. **Tests** — each phase adds ≥1 integration test before merge  
7. **Docs** — update `AI_SAVE_POINT` completion % when phase ships  

---

## Resource & risk notes

| Risk | Mitigation |
|------|------------|
| Netlify 26s timeout | Keep parallel expert calls; cache knowledge in memory |
| Token cost spike | Knowledge in context as ids + short summaries, not full JSON |
| Corpus authoring slow | Phase 2 batch script from taxonomy + GPT-assisted curation review |
| Scope creep | Phase gate — no Journey UI until Phase 7 data exists |
| 95% feels “not smart enough” | Tune Phase 6 learning loop + corpus depth, not new features |

---

## Recommended start (this week)

**Phase 1 only** — do not parallelize phases:

```text
Week 1:  1.1–1.6  Knowledge loader + API + 25 nodes
Week 2:  2.1–2.4  80 ingredients + 50 substitutions
Week 3:  3.1–3.7  Orchestrator + ledger persist
Week 4:  4.1–4.4  Reasoning in assistant (directions first)
```

Say **“start Phase 1”** and we implement `knowledge.ts` + loader + first 25 nodes.

---

## Phase checklist (printable)

| Phase | Target % | Layer focus | Ship when |
|-------|----------|-------------|-----------|
| 0 | 8% | Baseline | ✅ Done |
| 1 | 20% | L1 infra | Knowledge API live |
| 2 | 35% | L1 corpus | 250 nodes, substitutions |
| 3 | 50% | L2–L3 shell | Ledger + orchestrator |
| 4 | 65% | L3 | 3-direction reasoning |
| 5 | 78% | L2 | Brain 2.0 patterns |
| 6 | 88% | Learning | Replace → smarter plan |
| 7 | 93% | L4 | Cook Together lessons |
| 8 | 95% | L5–L6 | Hosting API + legacy nodes |

---

*One intelligence core. Eight phases. Then the paused engines become easy.*
