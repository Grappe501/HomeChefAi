import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse } from './utils/quotas.js';
import type { InventoryItem, Profile } from '../../src/types/index';
import { formatInventoryForAI, formatInventorySummary } from './utils/inventoryContext.js';

async function assistantReply(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
  history: { role: string; content: string }[] = []
): Promise<{ reply: string; suggested_items?: { name: string; quantity: number; unit: string }[]; action?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryBlock = formatInventoryForAI(inventory);
  const inventoryMeta = formatInventorySummary(inventory);

  if (!apiKey) {
    if (message.toLowerCase().includes('grilled cheese')) {
      return {
        reply: 'Did you use 2 slices of bread, 2 slices of cheese, and a little butter?',
        suggested_items: [
          { name: 'Bread', quantity: 2, unit: 'slices' },
          { name: 'Cheese', quantity: 2, unit: 'slices' },
          { name: 'Butter', quantity: 1, unit: 'tbsp' },
        ],
        action: 'confirm_usage',
      };
    }
    return { reply: `Hi! I'm ${profile.assistant_name}. Add your OPENAI_API_KEY for full AI assistant. Pantry (${inventoryMeta}):\n${inventoryBlock}` };
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
          content: `You are ${profile.assistant_name}, a friendly kitchen sous chef. User dietary: ${profile.dietary_restrictions.join(', ')}. Cuisines: ${profile.cuisine_preferences.join(', ')}. Allergies: ${profile.allergies.join(', ')}.
Pantry (${inventoryMeta}) — each line includes knowledge_id in brackets for ingredient intelligence:
${inventoryBlock}
When user says they cooked something, suggest ingredients used and ask for confirmation. For substitutions, prefer pantry items with matching knowledge ids. Return JSON: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|suggest_meal|general"}
Be concise, warm, one-thumb friendly. Reference memory: last meals from context.`,
        },
        ...history.slice(-6),
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('Assistant failed');
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content);
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ message: string; history?: { role: string; content: string }[] }>(event);
    if (!body?.message) return errorResponse('Missing message');

    const quota = await checkAndIncrementQuota(userId, 'assistant_messages');
    if (!quota.allowed) return quotaErrorResponse(quota.limits, quota.usage);

    let inventory: InventoryItem[] = [];
    let profile: Profile;

    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === userId);
      profile = store.profiles.find((p) => p.user_id === userId)!;
    } else if (user.token) {
      const db = getSupabaseUserClient(user.token);
      const { data: items } = await db.from('inventory_items').select('*').eq('user_id', userId);
      inventory = (items ?? []) as InventoryItem[];
      const { data: prof } = await db.from('profiles').select('*').eq('user_id', userId).single();
      profile = prof as Profile;
    } else {
      return errorResponse('Missing token', 401);
    }

    const result = await assistantReply(body.message, inventory, profile, body.history || []);
    return jsonResponse(result);
  }

  return errorResponse('Method not allowed', 405);
});
