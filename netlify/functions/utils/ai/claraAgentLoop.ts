/**
 * Agent Suite v6 Phase 2/3 — OpenAI function-calling agent loop for Clara.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { ClassifiedIntent } from './orchestrator.js';
import { isBasicAssistantMessage } from '../../../../src/types/credits.js';
import { formatInventoryForAI } from '../inventoryContext.js';
import { expertsForIntent } from './brainRegistry.js';
import {
  CLARA_AGENT_TOOLS,
  executeAgentTool,
  type AgentToolName,
  type AgentToolContext,
} from './claraAgentTools.js';
import {
  needsExpertSynthesis,
  runSequentialExpertChain,
  synthesizeClaraReply,
} from './expertSynthesis.js';
import type { AgentStreamEvent, ClaraRoutedReply } from './claraReplyTypes.js';

const MAX_AGENT_STEPS = 4;

export type AgentProgressHandler = (event: AgentStreamEvent) => void;

export function needsAgentLoop(message: string, intent: ClassifiedIntent): boolean {
  if (process.env.AGENT_V6_PHASE2 === 'false') return false;
  if (isBasicAssistantMessage(message)) return false;
  if (intent === 'substitution' || intent === 'skill' || intent === 'hosting') return false;
  if (/\b(three directions|pick a direction|what can i make tonight)\b/i.test(message)) return false;

  if (/\b(find|search|recipe|ideas|similar|in the mood|craving|library)\b/i.test(message)) return true;
  if (/\b(what can|what should|tonight|this week|meal plan)\b/i.test(message)) return true;
  if (intent === 'suggestion' || intent === 'meal_plan') return true;
  if (needsExpertSynthesis(message, intent)) return true;
  return message.length > 120;
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

function toolPreview(output: string): string {
  const line = output.split('\n').find(Boolean) ?? output;
  return line.slice(0, 120);
}

export async function runClaraAgentLoop(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
  history: { role: string; content: string }[],
  intent: ClassifiedIntent,
  token?: string,
  onProgress?: AgentProgressHandler,
): Promise<ClaraRoutedReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryBlock = formatInventoryForAI(inventory);
  const domain = intent === 'general' ? 'chat' : intent;
  const experts = expertsForIntent(domain as import('./brainRegistry.js').IntentDomain);

  const toolCtx: AgentToolContext = {
    userId: profile.user_id,
    token,
    message,
    inventory,
    profile,
  };

  const tools_used: string[] = [];
  const evidence: string[] = [];
  const toolOutputs: string[] = [];
  let agent_steps = 0;
  let search_mode: ClaraRoutedReply['search_mode'];
  let pending_preference: ClaraRoutedReply['pending_preference'];

  const emit = (event: AgentStreamEvent) => onProgress?.(event);

  if (!apiKey) {
    const pantry = await executeAgentTool('lookup_pantry', {}, toolCtx);
    return {
      reply: `${profile.assistant_name}: Add OPENAI_API_KEY for the agent loop.\n\n${pantry.output}`,
      intent,
      tools_used: ['lookup_pantry'],
      evidence: pantry.evidence,
      synthesis: false,
      agent_steps: 0,
    };
  }

  const phaseLabel = process.env.AGENT_V6_PHASE4 === 'false' ? (process.env.AGENT_V6_PHASE3 === 'false' ? 'Phase 2' : 'Phase 3') : 'Phase 4';
  const messages: {
    role: string;
    content?: string;
    tool_calls?: OpenAIToolCall[];
    tool_call_id?: string;
    name?: string;
  }[] = [
    {
      role: 'system',
      content: `You are ${profile.assistant_name}, Sous Chef Clara (Agent Suite v6 ${phaseLabel}).
Use tools to gather evidence before answering. Call tools when you need pantry, dish search, knowledge, or brain context.
User dietary: ${profile.dietary_restrictions.join(', ') || 'none'}. Allergies: ${profile.allergies.join(', ') || 'none'}.
After tools, respond with JSON only: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|confirm_preference|suggest_meal|pick_direction|general"}
When remember_preference was used, set action to confirm_preference and ask Chef to confirm saving the preference.
Never invent cook history. Prefer dish library IDs when recommending recipes.`,
    },
    ...history.slice(-4),
    { role: 'user', content: message },
  ];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    agent_steps = step + 1;
    emit({ type: 'step', step: agent_steps, max_steps: MAX_AGENT_STEPS });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: CLARA_AGENT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 600,
      }),
    });

    if (!response.ok) throw new Error('Agent loop failed');
    const data = (await response.json()) as {
      choices: { message: { content?: string; tool_calls?: OpenAIToolCall[] } }[];
    };
    const choice = data.choices[0]?.message;
    if (!choice) break;

    if (choice.tool_calls?.length) {
      messages.push({ role: 'assistant', content: choice.content ?? '', tool_calls: choice.tool_calls });

      for (const call of choice.tool_calls) {
        const toolName = call.function.name as AgentToolName;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          args = {};
        }

        emit({ type: 'tool_start', tool: toolName, step: agent_steps });
        const result = await executeAgentTool(toolName, args, toolCtx);
        if (result.search_mode) search_mode = result.search_mode;
        if (result.pending_preference) pending_preference = result.pending_preference;

        tools_used.push(toolName);
        toolOutputs.push(`[${toolName}]\n${result.output}`);
        evidence.push(...result.evidence);
        emit({ type: 'tool_done', tool: toolName, preview: toolPreview(result.output), step: agent_steps });

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: result.output.slice(0, 4000),
        });
      }
      continue;
    }

    const raw = choice.content ?? '';
    let parsed: { reply: string; suggested_items?: ClaraRoutedReply['suggested_items']; action?: string };
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? raw) as typeof parsed;
    } catch {
      parsed = { reply: raw || 'I could not complete that request.', action: 'general' };
    }

    const toolContext = toolOutputs.join('\n\n');

    if (needsExpertSynthesis(message, intent)) {
      const expertCount = Math.min(experts.filter((e) => e.id !== 'sous_chef').length, 3);
      emit({ type: 'synthesis', expert_count: expertCount });
      emit({ type: 'synthesis_start', expert_count: expertCount });
      const expert_outputs = await runSequentialExpertChain(
        message,
        experts,
        toolContext,
        inventoryBlock,
        profile,
      );
      const merged = await synthesizeClaraReply(
        message,
        expert_outputs,
        toolContext,
        inventoryBlock,
        profile,
        history,
        (token) => emit({ type: 'synthesis_token', token }),
      );
      const reply: ClaraRoutedReply = {
        ...merged,
        intent,
        evidence: [...new Set(evidence)].slice(0, 14),
        expert_ids: expert_outputs.map((o) => o.expert_id),
        expert_outputs,
        tools_used: [...new Set(tools_used)],
        synthesis: true,
        agent_steps,
        search_mode,
        pending_preference,
        action: pending_preference ? 'confirm_preference' : merged.action,
      };
      emit({ type: 'reply', reply });
      return reply;
    }

    const reply: ClaraRoutedReply = {
      reply: parsed.reply,
      suggested_items: parsed.suggested_items,
      action: pending_preference ? 'confirm_preference' : parsed.action,
      pending_preference,
      intent,
      evidence: [...new Set(evidence)].slice(0, 14),
      expert_ids: [],
      tools_used: [...new Set(tools_used)],
      synthesis: false,
      agent_steps,
      search_mode,
    };
    emit({ type: 'reply', reply });
    return reply;
  }

  const toolContext = toolOutputs.join('\n\n');
  const reply: ClaraRoutedReply = {
    reply: `${profile.assistant_name} gathered context but hit the step limit. ${toolContext.slice(0, 500)}`,
    intent,
    evidence: [...new Set(evidence)].slice(0, 14),
    tools_used: [...new Set(tools_used)],
    synthesis: false,
    agent_steps,
    search_mode,
  };
  emit({ type: 'reply', reply });
  return reply;
}
