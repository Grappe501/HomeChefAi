# Agent Suite v6 — Phase 3

**Status:** Shipped  
**Goal:** Hybrid dish retrieval, honest agent-loop credits, and live tool progress streaming in Clara.

## Changes

### 1. Hybrid dish search (`dishHybridSearch.ts` + `dishEmbeddings.ts` + `dishSearch.ts`)
- BM25 pre-filter → top 24 candidates → single OpenAI `text-embedding-3-small` batch
- Fusion score: 45% BM25 norm + 35% cosine similarity + 20% pantry fit
- Unified `searchDishes()` entry — hybrid when Phase 3 enabled, else BM25
- Used in agent `search_dishes` tool and Phase 1 router `match_dishes` path

### 2. Agent loop credit tier (`claraCredits.ts` + `credits.ts`)
- `agent_loop`: **2 credits** — multi-step OpenAI function-calling loop
- `agent_loop_synthesis`: **3 credits** — agent loop + sequential expert chain
- `resolveAssistantCreditAction()` centralizes routing in `assistant.ts` and `assistant-stream.ts`
- Expert synthesis without agent loop remains **2 credits**

### 3. Streaming tool progress (`assistant-stream.ts` + client)
- New Netlify function: `assistant-stream` (SSE via `@netlify/functions` `stream()`)
- Events: `credit`, `step`, `tool_start`, `tool_done`, `synthesis`, `reply`, `complete`, `error`
- Clara UI shows live tool labels during agent loop (falls back to standard `/assistant` on stream failure)
- Complex messages (>80 chars, non-basic) auto-use stream endpoint

### 4. Agent loop progress hooks (`claraAgentLoop.ts`)
- Optional `onProgress` callback emits stream events during tool rounds
- Tracks `agent_steps` and `search_mode` on replies

## Environment flags

| Variable | Default | Effect |
|----------|---------|--------|
| `AGENT_V6_PHASE3` | enabled | Set `false` to disable hybrid search + streaming path |
| `AGENT_V6_HYBRID` | enabled | Set `false` for BM25-only dish search |
| `AGENT_V6_STREAM` | enabled | Set `false` to disable SSE stream endpoint routing |
| `AGENT_V6_PHASE2` | enabled | Agent loop (Phase 2) — required for streaming |
| `AGENT_V6_EXPERT_MODE` | `sequential` | Expert chain mode |

## Credits summary

| Action | Credits |
|--------|---------|
| Basic / substitution / skill / directions | 0 |
| Standard complex Clara | 1 |
| Expert synthesis (router) | 2 |
| Agent loop | 2 |
| Agent loop + synthesis | 3 |

## Files

| File | Role |
|------|------|
| `dishEmbeddings.ts` | OpenAI embeddings + cosine similarity |
| `dishHybridSearch.ts` | BM25 + embedding fusion |
| `dishSearch.ts` | Unified search entry |
| `claraCredits.ts` | Credit + stream routing helpers |
| `claraAgentLoop.ts` | Progress callbacks |
| `assistant-stream.ts` | SSE streaming handler |
| `assistantContext.ts` | Shared session load |
| `assistant.ts` | Credit resolver wired |
| `src/lib/api.ts` | `assistantApi.chatStream` |
| `src/pages/Assistant.tsx` | Live tool progress UI |
| `src/types/credits.ts` | `agent_loop`, `agent_loop_synthesis` |

## Phase 4 (next)

- Pre-built embedding index shards for full-corpus semantic recall (no per-query embed batch)
- Stream expert synthesis tokens to client
- Agent loop telemetry dashboard
