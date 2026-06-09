# Agent Suite v6 — Phase 1

**Status:** Shipped  
**Goal:** Smarter deterministic layer before GPT — less noise, less duplication, honest credits.

## Changes

### 1. Intent-selective tool execution (`claraToolPlan.ts`)
- Tools run only when the classified intent and message patterns require them
- Greetings / basic pantry queries → `lookup_pantry` only (no brain reload)
- Removed always-on `query_brain` and duplicate `brain_memories` load

### 2. Deduplicated brain context (`claraToolRouter.ts`)
- Single `buildClaraContext()` call includes brain memories in `memory_block`
- Removed second `buildKitchenBrainContext()` in tool router

### 3. Expert knowledge slices (`expertKnowledge.ts` + `expertSynthesis.ts`)
- Each expert gets filtered knowledge nodes from their `knowledgeSlices` registry
- Message-token scoring picks relevant nodes per expert before council GPT call

### 4. Deep knowledge in lookup (`claraToolRouter.ts` + `deepLoader.ts`)
- `lookup_knowledge` merges graph nodes + `data/ai/deep/` entries
- Ingredient depth formatting via `formatIngredientDepth()`

### 5. Meal plan validator (`mealPlanValidator.ts`)
- Post-GPT repair: slots with &lt;40% pantry fit replaced from dish corpus
- Runs at end of `generateMealPlan()` for all plan paths

### 6. Cook-log AI fallback (`cookLogAiFallback.ts`)
- Focused single GPT call instead of full Clara router on low-confidence infer

### 7. Credit honesty
- Direction responses: `assistant_basic` (0 credits)
- Expert synthesis: 2 credits (two GPT passes) — legal ai-usage.html updated

## Files

| File | Role |
|------|------|
| `claraToolPlan.ts` | Intent → tool matrix |
| `claraToolRouter.ts` | Selective execution + deep lookup |
| `expertKnowledge.ts` | Slice-filtered expert context |
| `expertSynthesis.ts` | Tighter synthesis trigger + slices |
| `mealPlanValidator.ts` | Pantry repair loop |
| `cookLogAiFallback.ts` | Narrow cook-log GPT |
| `assistant.ts` | Credit routing |
| `cook-infer.ts` | Uses fallback |
| `meals.ts` | Validator wired |
| `credits.ts` | expert_synthesis = 2 |

## Phase 2 (next)

- BM25 / semantic retrieval over 280k dish corpus
- OpenAI function-calling agent loop
- Sequential expert chain (not single council call)
