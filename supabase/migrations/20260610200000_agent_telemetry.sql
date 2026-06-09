-- Agent Suite v6 Phase 4 — agent loop telemetry for Clara dashboard

CREATE TABLE IF NOT EXISTS agent_loop_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent text,
  tools_used text[] NOT NULL DEFAULT '{}',
  agent_steps smallint NOT NULL DEFAULT 0,
  search_mode text,
  synthesis boolean NOT NULL DEFAULT false,
  credit_cost smallint NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  stream boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_telemetry_user_created
  ON agent_loop_telemetry (user_id, created_at DESC);

ALTER TABLE agent_loop_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_telemetry_select_own ON agent_loop_telemetry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY agent_telemetry_insert_own ON agent_loop_telemetry
  FOR INSERT WITH CHECK (auth.uid() = user_id);
