import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, query, queryOne } from './utils/db.js';
import type { InventoryItem, Profile } from '../../src/types/index';

async function assistantReply(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
  history: { role: string; content: string }[] = []
): Promise<{ reply: string; suggested_items?: { name: string; quantity: number; unit: string }[]; action?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryList = inventory.map((i) => `${i.name}: ${i.quantity} ${i.unit}`).join(', ') || 'empty';

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
    return { reply: `Hi! I'm ${profile.assistant_name}. Add your OPENAI_API_KEY for full AI assistant. Your pantry: ${inventoryList}` };
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
          content: `You are ${profile.assistant_name}, a friendly kitchen sous chef. User dietary: ${profile.dietary_restrictions.join(', ')}. Cuisines: ${profile.cuisine_preferences.join(', ')}. Pantry: ${inventoryList}. 
When user says they cooked something, suggest ingredients used and ask for confirmation. Return JSON: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|suggest_meal|general"}
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
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ message: string; history?: { role: string; content: string }[] }>(event);
    if (!body?.message) return errorResponse('Missing message');

    let inventory: InventoryItem[] = [];
    let profile: Profile;

    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === userId);
      profile = store.profiles.find((p) => p.user_id === userId)!;
    } else {
      inventory = await query('SELECT * FROM inventory_items WHERE user_id = $1', [userId]) as InventoryItem[];
      profile = (await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId])) as Profile;
    }

    const result = await assistantReply(body.message, inventory, profile, body.history || []);
    return jsonResponse(result);
  }

  return errorResponse('Method not allowed', 405);
});
