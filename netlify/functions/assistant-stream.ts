/**
 * Agent Suite v6 Phase 3 — streaming Clara agent loop (SSE).
 */

import { stream } from '@netlify/functions';
import { parseBody, corsHeaders } from './utils/response.js';
import { chargeCredits, checkAndIncrementQuota } from './utils/quotas.js';
import { loadAssistantSession } from './utils/assistantContext.js';
import { classifyIntent } from './utils/ai/orchestrator.js';
import { resolveAssistantCreditAction, shouldStreamAgentLoop } from './utils/ai/claraCredits.js';
import { runClaraAgentLoop } from './utils/ai/claraAgentLoop.js';
import { routeClaraReply } from './utils/ai/claraToolRouter.js';
import { logGenerationToLedger } from './utils/ai/ledgerStore.js';
import { logAgentTelemetry } from './utils/ai/agentTelemetry.js';
import type { AgentStreamEvent, ClaraRoutedReply } from './utils/ai/claraReplyTypes.js';

function sseLine(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export const handler = stream(async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body = parseBody<{ message: string; history?: { role: string; content: string }[] }>(event);
  if (!body?.message) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing message' }) };
  }

  const loaded = await loadAssistantSession(event);
  if ('error' in loaded) {
    const err = loaded.error;
    return { statusCode: err.statusCode, headers: corsHeaders(), body: err.body };
  }

  const { session } = loaded;
  const intent = classifyIntent(body.message);
  const creditAction = resolveAssistantCreditAction(body.message, intent);

  const credit = await chargeCredits(session.userId, creditAction);
  if (!credit.allowed) {
    return {
      statusCode: 402,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: 'Credit limit reached',
        upgrade_required: credit.upgrade_required,
      }),
    };
  }

  await checkAndIncrementQuota(session.userId, 'assistant_messages', { message: body.message, skipCredit: true });

  const encoder = new TextEncoder();
  const history = body.history ?? [];
  const started = Date.now();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(sseLine(payload)));

      try {
        send({
          type: 'credit',
          credit_cost: credit.cost,
          credits_remaining: credit.status.remaining,
        });

        let routed: ClaraRoutedReply;

        if (shouldStreamAgentLoop(body.message, intent)) {
          routed = await runClaraAgentLoop(
            body.message,
            session.inventory,
            session.profile,
            history,
            intent,
            session.token,
            (streamEvent: AgentStreamEvent) => send(streamEvent),
          );
        } else {
          routed = await routeClaraReply(
            body.message,
            session.inventory,
            session.profile,
            history,
            session.token,
          );
          send({ type: 'reply', reply: routed });
        }

        await logGenerationToLedger(
          session.userId,
          session.token,
          `generation:chat_stream:${Date.now()}`,
          {
            domain: 'chat',
            recommendation: routed.reply.slice(0, 200),
            why: routed.synthesis ? 'Expert synthesis + agent stream' : `Agent stream · ${(routed.tools_used ?? []).join(', ')}`,
            evidence: routed.evidence ?? [],
            confidence: routed.synthesis ? 0.78 : 0.68,
            expert_ids: routed.expert_ids ?? [],
            metadata: {
              intent: routed.intent,
              action: routed.action,
              tools_used: routed.tools_used,
              synthesis: routed.synthesis,
              agent_steps: routed.agent_steps,
              search_mode: routed.search_mode,
              stream: true,
              phase: 4,
            },
          },
          session.profile.household_id,
        );

        await logAgentTelemetry({
          user_id: session.userId,
          intent: routed.intent,
          tools_used: routed.tools_used ?? [],
          agent_steps: routed.agent_steps ?? 0,
          search_mode: routed.search_mode,
          synthesis: !!routed.synthesis,
          credit_cost: credit.cost,
          latency_ms: Date.now() - started,
          stream: true,
        });

        send({
          type: 'complete',
          reply: routed.reply,
          suggested_items: routed.suggested_items,
          action: routed.action,
          pending_preference: routed.pending_preference,
          directions: routed.directions,
          intent: routed.intent,
          evidence: routed.evidence,
          expert_ids: routed.expert_ids,
          tools_used: routed.tools_used,
          synthesis: routed.synthesis,
          agent_steps: routed.agent_steps,
          search_mode: routed.search_mode,
          credit_cost: credit.cost,
          credits_remaining: credit.status.remaining,
          credits_used: credit.status.used,
          credits_pool: credit.status.pool,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream failed';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
    body: readable,
  };
});
