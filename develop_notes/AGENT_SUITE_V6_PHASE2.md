# Agent Suite v6 — Phase 2

**Status:** Shipped  
**Goal:** Smarter dish retrieval, native OpenAI tool loop, and sequential expert chain for complex Clara queries.

## Changes

### 1. BM25 dish retrieval (`dishBm25.ts`)
- In-memory BM25 index over ~280k dish corpus (`listAllDishes()`)
- Query tokenization with stop-word filtering
- Top BM25 hits re-ranked with pantry fit via `scoreDishNode()`
- Fallback to pantry-only matching when query is empty or BM25 returns nothing
- Cache cleared via `clearDishBm25Cache()` (cold start builds index once per instance)

### 2. OpenAI function-calling agent loop (`claraAgentLoop.ts` + `claraAgentTools.ts`)
- Up to 4 tool-call rounds before final JSON reply
- Eight tools: `lookup_pantry`, `search_dishes`, `lookup_knowledge`, `find_substitutes`, `suggest_directions`, `get_brain_context`, `skill_coach`, `local_sourcing`
- `search_dishes` uses BM25 + pantry re-rank
- Triggered when message needs multi-step evidence (recipe search, suggestions, long/complex queries)
- Skipped for basic messages, substitutions, skill coaching, hosting, and explicit “three directions” flows

### 3. Sequential expert chain (`expertSynthesis.ts`)
- Default: `runSequentialExpertChain()` — one GPT call per expert (max 3), each sees prior expert outputs
- Legacy council batch preserved behind `AGENT_V6_EXPERT_MODE=council`
- `runExpertSynthesis()` delegates to sequential chain by default

### 4. Router integration (`claraToolRouter.ts` + `claraToolPlan.ts`)
- `needsAgentLoop()` → `runClaraAgentLoop()` before Phase 1 deterministic tool bundle
- Phase 1 `match_dishes` path uses BM25 when `needsDishSearch(message)` is true
- Shared reply type in `claraReplyTypes.ts` (avoids circular imports)

## Environment flags

| Variable | Default | Effect |
|----------|---------|--------|
| `AGENT_V6_PHASE2` | enabled | Set `false` to disable agent loop; Phase 1 router only |
| `AGENT_V6_EXPERT_MODE` | `sequential` | Set `council` for legacy single-call expert batch |

## Credits

Unchanged from Phase 1:
- Basic / substitution / skill / directions-first → `assistant_basic` (0 credits)
- Expert synthesis (budget, nutrition, long constraint messages) → `expert_synthesis` (2 credits)
- Agent loop without synthesis → `assistant_complex` (1 credit)
- Agent loop with synthesis → still charged via `needsExpertSynthesis()` before routing

## Files

| File | Role |
|------|------|
| `dishBm25.ts` | BM25 index + pantry re-rank |
| `claraAgentTools.ts` | OpenAI tool schemas + executors |
| `claraAgentLoop.ts` | Function-calling loop + synthesis hook |
| `claraReplyTypes.ts` | Shared `ClaraRoutedReply` type |
| `expertSynthesis.ts` | Sequential expert chain |
| `claraToolRouter.ts` | Agent loop branch + BM25 in match path |
| `claraToolPlan.ts` | `needsDishSearch()` helper |

## Phase 3 (shipped)

See `AGENT_SUITE_V6_PHASE3.md` — hybrid search, agent loop credits, streaming.

## Phase 4 (next)
