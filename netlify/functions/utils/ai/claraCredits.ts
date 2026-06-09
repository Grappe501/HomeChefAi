/**
 * Agent Suite v6 Phase 3 — credit action resolution for Clara / agent loop.
 */

import type { CreditAction } from '../../../../src/types/credits.js';
import { isBasicAssistantMessage } from '../../../../src/types/credits.js';
import type { ClassifiedIntent } from './orchestrator.js';
import { wantsDirectionsFirst } from './orchestrator.js';
import { needsExpertSynthesis } from './expertSynthesis.js';
import { needsAgentLoop } from './claraAgentLoop.js';
import { parseDishRecipeRequest } from './dishRecipeFormat.js';

export function resolveAssistantCreditAction(message: string, intent: ClassifiedIntent): CreditAction {
  if (parseDishRecipeRequest(message)) return 'assistant_basic';
  if (isBasicAssistantMessage(message)) return 'assistant_basic';
  if (intent === 'substitution') return 'assistant_basic';
  if (intent === 'skill') return 'assistant_basic';
  if (intent === 'hosting') return 'hosting_plan';
  if (wantsDirectionsFirst(message)) return 'assistant_basic';

  const agentLoop = needsAgentLoop(message, intent);
  const synthesis = needsExpertSynthesis(message, intent);

  if (agentLoop && synthesis) return 'agent_loop_synthesis';
  if (agentLoop) return 'agent_loop';
  if (synthesis) return 'expert_synthesis';
  return 'assistant_complex';
}

export function shouldStreamAgentLoop(message: string, intent: ClassifiedIntent): boolean {
  if (process.env.AGENT_V6_PHASE3 === 'false') return false;
  if (process.env.AGENT_V6_STREAM === 'false') return false;
  return needsAgentLoop(message, intent);
}
