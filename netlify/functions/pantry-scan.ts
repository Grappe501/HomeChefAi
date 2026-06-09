import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { chargeCredits, quotaErrorResponse } from './utils/quotas.js';
import type { PantryScanItem, PantryScanResult } from '../../src/types/kitchenPredictions.js';
import { searchKnowledge } from './utils/ai/knowledgeLoader.js';
import { resolveWizardKnowledgeIdSimple } from '../../src/types/knowledgeIdCore.js';

async function parsePantryImage(imageBase64: string): Promise<PantryScanResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      scene_summary: 'Demo mode — add OPENAI_API_KEY for real pantry vision.',
      items: [
        {
          name: 'Milk',
          quantity: 1,
          unit: 'gallon',
          category: 'dairy',
          location: 'fridge',
          confidence: 0.5,
          needs_expiration: true,
        },
        {
          name: 'Eggs',
          quantity: 1,
          unit: 'dozen',
          category: 'dairy',
          location: 'fridge',
          confidence: 0.5,
          needs_expiration: true,
        },
      ],
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
          content: `You analyze fridge, pantry, or shelf photos for a home kitchen inventory app.
Return ONLY valid JSON:
{"scene_summary":"brief description","items":[{"name":"string","quantity":number,"unit":"string","category":"produce|dairy|meat|pantry|frozen|beverage|other","location":"pantry|fridge|freezer","confidence":0.0-1.0,"needs_expiration":boolean,"suggested_expiration":"YYYY-MM-DD or null"}]}
List distinct food items visible. Estimate quantities conservatively. Infer location from item type.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify food items in this kitchen photo for pantry inventory.' },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content) as PantryScanResult;
}

function linkKnowledgeIds(items: PantryScanItem[]): PantryScanItem[] {
  return items.map((item) => {
    const hits = searchKnowledge(item.name, 'ingredient', 3);
    const knowledge_id = hits[0]?.id ?? resolveWizardKnowledgeIdSimple(item.name);
    return { ...item, knowledge_id };
  });
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  const body = parseBody<{ image: string; action?: string; items?: PantryScanItem[] }>(event);
  if (!body) return errorResponse('Invalid body');

  if (body.action === 'confirm' && body.items?.length) {
    const userId = user.id;
    const items = body.items.map((item) => ({
      user_id: userId,
      name: item.name,
      category: item.category || 'other',
      quantity: item.quantity || 1,
      unit: item.unit || 'each',
      expiration_date: item.suggested_expiration ?? undefined,
      location: item.location || 'pantry',
      knowledge_id: item.knowledge_id,
      added_via: 'pantry_scan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (useDevStore()) {
      const store = loadStore();
      const { v4: uuidv4 } = await import('uuid');
      for (const row of items) {
        store.inventory_items.push({ ...row, id: uuidv4() } as never);
      }
      const { saveStore } = await import('./utils/db.js');
      saveStore(store);
      return jsonResponse({ items_added: items.length });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data, error } = await db.from('inventory_items').insert(items).select();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ items_added: data?.length ?? items.length });
  }

  if (!body.image) return errorResponse('Missing image');

  const credit = await chargeCredits(user.id, 'pantry_vision');
  if (!credit.allowed) {
    return quotaErrorResponse(
      { ai_credits_used: credit.status.pool },
      { ai_credits_used: credit.status.used },
      credit.status,
    );
  }

  const parsed = await parsePantryImage(body.image);
  const items = linkKnowledgeIds(parsed.items ?? []);

  return jsonResponse({
    parsed: { ...parsed, items },
    credit_cost: credit.cost,
    credits_remaining: credit.status.remaining,
  });
});
