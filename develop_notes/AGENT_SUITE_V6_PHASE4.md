# Agent Suite v6 — Phase 4

**Status:** Shipped  
**Goal:** Pre-built embedding shards, streaming expert synthesis, agent telemetry, and deploy-safe corpus split.

## Changes

### 1. Compact search pack + static corpus (`build-search-pack.mjs`)
- `data/ai/search/dish-bm25-pack.json` — BM25 index for 280k+ dishes (~60MB vs 340MB full corpus in functions)
- Full dish JSON served from `public/data/ai/dishes/corpus/` (static CDN on Netlify)
- Functions hydrate recipe steps on demand via cuisine file fetch

### 2. Pre-built embedding shards (`build-embed-shards.mjs` + `dishEmbedIndex.ts`)
- 80 representative dishes × 48 cuisines, int8-quantized vectors
- Runtime: **query-only** OpenAI embed + shard cosine search (no per-query candidate embed batch)
- Fusion with BM25 in `searchDishesHybrid` → `shard_hybrid` mode

### 3. Streaming expert synthesis (`expertSynthesis.ts`)
- OpenAI `stream: true` for final Clara merge after expert chain
- SSE events: `synthesis_start`, `synthesis_token`
- Assistant UI shows live synthesis draft during agent loop

### 4. Agent loop telemetry (`agentTelemetry.ts` + migration)
- Table `agent_loop_telemetry` — tools, steps, search_mode, latency, credits
- Logged from `assistant-stream.ts`
- Brain page dashboard: `GET brain?action=agent_telemetry`

### 5. Deploy fix (`netlify.toml`)
- Functions bundle search pack + knowledge — **not** 340MB dish corpus
- Corpus static at `/data/ai/dishes/corpus/*.json`

## Environment flags

| Variable | Default | Effect |
|----------|---------|--------|
| `AGENT_V6_PHASE4` | enabled | Set `false` to disable shard search + synth stream |
| `AGENT_V6_SHARDS` | enabled | Set `false` for Phase 3 hybrid (candidate embed batch) |
| `AGENT_V6_SYNTH_STREAM` | enabled | Set `false` for non-streaming synthesis |
| `CORPUS_STATIC_URL` | site URL | Override static corpus base |

## Scripts

```bash
npm run knowledge:search-pack   # BM25 pack + copy corpus to public/
npm run knowledge:embed-shards  # OpenAI shard build (requires OPENAI_API_KEY)
```

## Files

| File | Role |
|------|------|
| `dishSearchPack.ts` | Compact BM25 doc loader |
| `dishEmbedIndex.ts` | Shard semantic search |
| `dishCatalog.ts` | Static corpus hydration |
| `dishBm25.ts` | Pack-based BM25 (async) |
| `dishHybridSearch.ts` | Shard + BM25 fusion |
| `agentTelemetry.ts` | Telemetry log + summary |
| `assistant-stream.ts` | Telemetry + stream synthesis |
| `Brain.tsx` | Agent stats card |
