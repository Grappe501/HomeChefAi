/**
 * Agent Suite v6 Phase 4 — agent loop telemetry (Supabase + dev store).
 */

import { getSupabaseAdmin, useDevStore } from '../supabase.js';
import { loadStore, saveStore } from '../devStore.js';

export interface AgentTelemetryEvent {
  user_id: string;
  intent?: string;
  tools_used: string[];
  agent_steps: number;
  search_mode?: string;
  synthesis: boolean;
  credit_cost: number;
  latency_ms: number;
  stream: boolean;
}

export async function logAgentTelemetry(event: AgentTelemetryEvent): Promise<void> {
  if (useDevStore()) {
    const store = loadStore();
    if (!store.agent_telemetry) store.agent_telemetry = [];
    store.agent_telemetry.push({ ...event, created_at: new Date().toISOString() });
    if (store.agent_telemetry.length > 500) store.agent_telemetry = store.agent_telemetry.slice(-500);
    saveStore(store);
    return;
  }

  try {
    const db = getSupabaseAdmin();
    await db.from('agent_loop_telemetry').insert({
      user_id: event.user_id,
      intent: event.intent ?? null,
      tools_used: event.tools_used,
      agent_steps: event.agent_steps,
      search_mode: event.search_mode ?? null,
      synthesis: event.synthesis,
      credit_cost: event.credit_cost,
      latency_ms: event.latency_ms,
      stream: event.stream,
    });
  } catch (err) {
    console.warn('agent telemetry insert failed:', err);
  }
}

export async function getAgentTelemetrySummary(userId: string, days = 30): Promise<{
  total_runs: number;
  avg_steps: number;
  avg_latency_ms: number;
  top_tools: { tool: string; count: number }[];
  search_modes: Record<string, number>;
}> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  if (useDevStore()) {
    const store = loadStore();
    const rows = (store.agent_telemetry ?? []).filter(
      (r: { user_id: string; created_at?: string }) => r.user_id === userId && (!r.created_at || r.created_at >= since),
    );
    return summarize(rows);
  }

  const db = getSupabaseAdmin();
  const { data } = await db
    .from('agent_loop_telemetry')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  return summarize(data ?? []);
}

function summarize(rows: {
  agent_steps?: number;
  latency_ms?: number;
  tools_used?: string[];
  search_mode?: string;
}[]): {
  total_runs: number;
  avg_steps: number;
  avg_latency_ms: number;
  top_tools: { tool: string; count: number }[];
  search_modes: Record<string, number>;
} {
  const toolCounts = new Map<string, number>();
  const searchModes: Record<string, number> = {};
  let steps = 0;
  let latency = 0;

  for (const r of rows) {
    steps += r.agent_steps ?? 0;
    latency += r.latency_ms ?? 0;
    for (const t of r.tools_used ?? []) toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1);
    const mode = r.search_mode ?? 'unknown';
    searchModes[mode] = (searchModes[mode] ?? 0) + 1;
  }

  const n = rows.length || 1;
  const top_tools = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tool, count]) => ({ tool, count }));

  return {
    total_runs: rows.length,
    avg_steps: Math.round((steps / n) * 10) / 10,
    avg_latency_ms: Math.round(latency / n),
    top_tools,
    search_modes: searchModes,
  };
}
