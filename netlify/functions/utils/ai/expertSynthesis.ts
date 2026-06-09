/**
 * Brain 4.0 — Multi-expert structured synthesis before Clara's final voice.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { ExpertDefinition, ExpertId } from './brainRegistry.js';
import { EXPERT_REGISTRY } from './brainRegistry.js';

export interface ExpertOutput {
  expert_id: ExpertId;
  display_name: string;
  recommendation: string;
  why: string;
  evidence: string[];
  confidence: number;
}

export function needsExpertSynthesis(message: string, intent: string): boolean {
  if (intent === 'meal_plan') return true;
  if (intent === 'hosting' || intent === 'substitution' || intent === 'suggestion') return false;
  if (message.length > 120) return true;
  return /\b(budget|healthy|nutrition|allerg|under \$|\$\d|cheap|constraint|balanced|macro|low.?carb|high.?protein)\b/i.test(
    message,
  );
}

export function formatExpertOutputsForPrompt(outputs: ExpertOutput[]): string {
  if (!outputs.length) return '';
  return outputs
    .map(
      (o) =>
        `[${o.display_name}] (${Math.round(o.confidence * 100)}%)\nRecommendation: ${o.recommendation}\nWhy: ${o.why}\nEvidence: ${o.evidence.join(', ') || 'none'}`,
    )
    .join('\n\n');
}

export async function runExpertSynthesis(
  message: string,
  experts: ExpertDefinition[],
  toolContext: string,
  inventoryBlock: string,
  profile: Profile,
): Promise<ExpertOutput[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const active = experts.filter((e) => e.id !== 'sous_chef').slice(0, 3);
  if (!apiKey || !active.length) {
    return active.map((e) => ({
      expert_id: e.id,
      display_name: e.displayName,
      recommendation: 'Use pantry and context below.',
      why: e.role,
      evidence: [],
      confidence: 0.5,
    }));
  }

  const expertList = active
    .map((e) => `- ${e.id}: ${e.displayName} — ${e.systemPromptPrefix}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are the SousChef expert council. Each expert gives ONE structured opinion about the user's kitchen question.
Dietary: ${profile.dietary_restrictions.join(', ') || 'none'}. Allergies: ${profile.allergies.join(', ') || 'none'}.
Pantry:
${inventoryBlock}
${toolContext ? `\nTool context:\n${toolContext}` : ''}

Experts:
${expertList}

Return JSON: {"experts":[{"expert_id":"string","recommendation":"string","why":"string","evidence":["string"],"confidence":0.0-1.0}]}
Only include experts: ${active.map((e) => e.id).join(', ')}. Be concise. Never invent cook history.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 700,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as {
    experts?: {
      expert_id: string;
      recommendation: string;
      why: string;
      evidence?: string[];
      confidence?: number;
    }[];
  };

  return (parsed.experts ?? []).map((row) => {
    const def = EXPERT_REGISTRY[row.expert_id as ExpertId];
    return {
      expert_id: (row.expert_id as ExpertId) ?? 'executive_chef',
      display_name: def?.displayName ?? row.expert_id,
      recommendation: row.recommendation,
      why: row.why,
      evidence: row.evidence ?? [],
      confidence: row.confidence ?? 0.65,
    };
  });
}

export async function synthesizeClaraReply(
  message: string,
  expertOutputs: ExpertOutput[],
  toolContext: string,
  inventoryBlock: string,
  profile: Profile,
  history: { role: string; content: string }[],
): Promise<{ reply: string; suggested_items?: { name: string; quantity: number; unit: string }[]; action?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const expertBlock = formatExpertOutputsForPrompt(expertOutputs);
  const assistantName = profile.assistant_name ?? 'Clara';

  if (!apiKey) {
    return {
      reply: `${assistantName} consulted ${expertOutputs.length} advisors. ${expertOutputs[0]?.recommendation ?? 'Add OPENAI_API_KEY for full synthesis.'}`,
      action: 'general',
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${EXPERT_REGISTRY.sous_chef.systemPromptPrefix}
Merge expert council inputs into ONE warm voice. Address user as Chef.
Pantry:
${inventoryBlock}
${toolContext ? `\nKitchen context:\n${toolContext}` : ''}
${expertBlock ? `\nExpert council:\n${expertBlock}` : ''}
Return JSON: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|suggest_meal|pick_direction|general"}
Be concise. Cite evidence when relevant. Never invent history.`,
        },
        ...history.slice(-6),
        { role: 'user', content: message },
      ],
      max_tokens: 550,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('Expert synthesis failed');
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content) as {
    reply: string;
    suggested_items?: { name: string; quantity: number; unit: string }[];
    action?: string;
  };
}
