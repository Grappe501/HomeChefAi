/**
 * Agent Suite v6 — focused cook-log ingredient inference (replaces full Clara router).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import { formatInventoryForAI } from '../inventoryContext.js';

export interface CookLogAiResult {
  reply: string;
  suggested_items: { name: string; quantity: number; unit: string }[];
  confidence: number;
}

export async function inferCookLogWithAi(
  mealDescription: string,
  inventory: InventoryItem[],
  profile: Profile,
): Promise<CookLogAiResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const inventoryBlock = formatInventoryForAI(inventory, 32);

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
          content: `Extract likely pantry ingredients used to cook a meal. Use ONLY items plausible for the dish and prefer names that match the user's pantry list when possible.
Return JSON: {"reply":"one sentence confirming the meal","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"confidence":0.0-1.0}
Max 12 ingredients. Use sensible kitchen units (lb, cup, tbsp, each, slice, clove).`,
        },
        {
          role: 'user',
          content: `Meal cooked: ${mealDescription}\n\nPantry:\n${inventoryBlock}`,
        },
      ],
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as {
    reply?: string;
    suggested_items?: { name: string; quantity: number; unit: string }[];
    confidence?: number;
  };

  return {
    reply: parsed.reply ?? `Logged: ${mealDescription}`,
    suggested_items: (parsed.suggested_items ?? []).filter((i) => i.name?.trim()),
    confidence: parsed.confidence ?? 0.7,
  };
}
