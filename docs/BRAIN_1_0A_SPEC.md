# Brain 1.0A — Build Spec

**Status:** ✅ Built — June 2026  
**Gate:** V3.1 smoke test recommended before production deploy  
**Date:** June 2026  
**Related:** `NORTH_STAR.md`, `develop_notes/HOUSEHOLD_FOOD_GRAPH_1_0.md`, `develop_notes/BRAND_FREEZE_1_0.md`

> **Brand Freeze active.** No branding, pricing, or roadmap doc changes. Build this.

---

## Purpose

Brain 1.0A is the **first intelligence layer**. It makes SousChef feel like it's paying attention.

After only **3 receipts** and **5 cook logs**, the Sous Chef should surface insights that make Chef ask:

> "How did it know that?"

That is the **emotional acceptance test**. Not a technical checklist.

---

## Current → Next state

### Current

```
SousChef
├── Inventory Engine
├── Receipt Engine
├── Pantry Wizard
├── Meal Planner
├── Assistant (Clara)
├── Cook Together Foundation
└── XP / Gamification Foundation
```

### Next (Brain 1.0A)

```
SousChef
├── Inventory Engine
├── Food Brain 1.0A
│   ├── Memories
│   ├── Consumption Cycles
│   ├── Waste Tracking
│   ├── Grocery Intelligence
│   ├── Inference Layer
│   └── Confidence Engine
└── Brain Insights UI (/brain + dashboard card)
```

**Do not replace** `suggestions.ts` yet — Brain runs in parallel. Deprecate in 1.0B.

---

## Example insights (acceptance bar)

After minimal data, Sous Chef should say things like:

| Insight | Type |
|---------|------|
| "Chef, you appear to buy milk about every 8 days." | consumption |
| "Chef, tacos seem to be one of your household favorites." | habit |
| "Chef, spinach has been discarded three times in the last month." | waste |
| "Chef, your household strongly prefers Cajun and Southern meals." | preference / archetype |
| "Chef, you typically cook most often on Thursdays and Sundays." | habit |

Voice: Sous Chef assistant — respectful, professional. Always **Chef**.

---

## Explainability rule (critical)

Every memory and insight **must** answer:

### Why do we know this?

Tap an insight → show provenance:

```
You buy milk every 8 days.

Based on:
• 6 milk purchases
• 48 days of history
• Average cycle: 7.8 days
• Confidence: 92%
```

| Requirement | Detail |
|-------------|--------|
| Source events | Link to receipts, cook logs, inventory deletes |
| Counts | Number of observations |
| Time window | Days/weeks of history |
| Computed value | Average, frequency, etc. |
| Confidence | 0–100% — deterministic formula |

**Trust is the product.** Black-box AI insights are forbidden in 1.0A. LLM may write prose; **never** invent facts.

### No insight without evidence (no exceptions)

Every surfaced memory **must** include in metadata:

| Field | Required |
|-------|----------|
| `observation_count` | Evidence count |
| `history_days` | Date range span |
| `confidence` | 0–1 score |
| `evidence_lines` | Human-readable proof bullets |
| `source_events` | Receipt / cook log / waste event IDs |

If evidence is insufficient → memory stored but **not surfaced**.

### Insight quality bar

**Good:** "Chef, you appear to buy milk about every 8 days."

**Better:** "Chef, you're probably running low on milk. Based on your normal usage, I'd expect you'll need more in the next two days."

Emotional acceptance test: Chef says *"How did it know that?"* — not merely *"That's technically accurate."*

Store provenance in `household_memories.metadata` JSONB:

```json
{
  "source_events": ["receipt:abc", "receipt:def"],
  "observation_count": 6,
  "history_days": 48,
  "computed_value": 7.8,
  "confidence": 0.92,
  "formula": "consumption_cycle_v1"
}
```

---

## Scope (in)

### Database (migration)

| Table | Purpose |
|-------|---------|
| `household_memories` | Typed memories with confidence + metadata |
| `consumption_cycles` | Item purchase frequency patterns |
| `waste_events` | Spoilage / discard tracking |
| `grocery_list_items` | Brain-generated list items with `source` + `reason` |
| `recommendation_history` | Log of surfaced insights (for dedup + analytics) |

Household-scoped where applicable. RLS follows existing household patterns.

### Memory types (1.0A)

```
preference | consumption | waste | habit | shopping
```

Reserved for later (schema-ready, generator not required):

```
family_preference | tradition | local_food | skill_learned
```

### Event hooks

| Event | Graph write | Memory trigger |
|-------|-------------|----------------|
| Receipt verify | PURCHASED edges | consumption, shopping |
| Cook log confirm | CONSUMES edges | habit, preference |
| Inventory delete / spoilage | WASTES edge | waste |

### Memory generator

- **Deterministic first** — rules, counts, averages, frequency analysis
- Runs synchronously on hooks (async queue optional later)
- Idempotent — same events don't duplicate memories
- Updates existing memory when confidence improves

### Inference layer

- Reads memories + raw events for household
- Archetype catalog: JSON in `netlify/functions/data/archetypes.json`
- Cuisine/style inference from cook log meal names + profile cuisine prefs
- Day-of-week cooking frequency from usage_logs

### Confidence engine

Minimum observations before surfacing:

| Insight type | Min observations | Min confidence |
|--------------|------------------|----------------|
| Consumption cycle | 3 purchases | 70% |
| Habit (favorite meal) | 3 cook logs | 75% |
| Waste pattern | 2 waste events | 80% |
| Archetype preference | 5 cook logs + profile | 65% |
| Day-of-week pattern | 5 cook logs | 70% |

Below threshold → memory stored but not surfaced (or shown as "learning your kitchen").

### API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/brain/insights` | GET | List surfaced insights for household |
| `/brain/memories` | GET | All memories (filter by type) |
| `/brain/memories/:id` | GET | Single memory with full provenance |
| `/brain/grocery` | GET/POST | Grocery list items with reasons |

Or extend existing function pattern — one `brain.ts` handler.

### UI

| Surface | Purpose |
|---------|---------|
| `/brain` page | Insights timeline — tap for provenance |
| Dashboard card | Top 1–3 insights + link to /brain |
| Grocery list | Items show "Why is this here?" |

Assistant (Clara) **reads** Brain insights in 1.0A but full Clara-as-graph-interface comes in 1.0B.

---

## Scope (out)

- Goal-based recommendations (1.0B)
- LLM-first memory generation
- Replacing `suggestions.ts`
- Journey, Cookbook, Culture, Experience engines
- Stripe / billing gates
- Visual redesign / brand tokens in UI
- Family preference graph per-person (schema reserved)

---

## Implementation order

```
1. Migration — 5 tables + RLS
2. memoryGenerator.ts — deterministic rules
3. confidence.ts — thresholds + scoring
4. Event hooks — receipts.ts, usage.ts, inventory.ts
5. brain.ts API — insights + provenance
6. Archetype catalog JSON
7. /brain page + BrainInsightCard component
8. Dashboard card
9. grocery_list_items basic UI hook (optional if time)
10. Manual test — 3 receipts, 5 cook logs → insights appear
```

---

## Feature gate (SousChef Promise)

Every insight must map to at least one:

1. Cook with confidence  
2. Waste less  
3. Save time  
4. Learn  
5. Gather people together  
6. Preserve food traditions  
7. Create memorable experiences  

Most 1.0A insights → **confidence, waste less, save time**.

---

## Testing

### Automated

- Unit tests for memory generator (consumption cycle, habit frequency, waste count)
- Confidence threshold edge cases
- Hook idempotency

### Manual (acceptance)

1. New household, onboard
2. Verify 3 receipts (include milk twice+)
3. Log 5 meals (include tacos 2x, one on a Thursday)
4. Delete spinach from inventory 2x (waste)
5. Open `/brain` — see ≥3 insights with provenance
6. Tap insight — "Based on..." panel shows counts + confidence
7. Emotional check: would Chef say "How did it know that?"

---

## Success metrics

| Metric | Target |
|--------|--------|
| Insights after 3 receipts + 5 cook logs | ≥3 surfaced |
| Provenance on every insight | 100% |
| Confidence displayed | 100% |
| False insights (wrong facts) | 0 |
| `/brain` page load | <2s |

---

## Post-1.0A prediction

Users will spend more time with **Clara** (Sous Chef) because she becomes the interface to the Household Food Graph. That's 1.0B — but design hooks now so assistant can read `household_memories`.

---

## Gate before starting

- [ ] V3.1 phone smoke test passed (`docs/V31_QA.md`)
- [x] Brain 1.0A implementation (`brain.ts`, memory generator, `/brain` UI)
- [ ] Production deploy + manual acceptance (3 receipts, 5 cook logs)

---

*Teach SousChef how to remember. Make every insight explainable.*
