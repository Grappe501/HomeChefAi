import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, query, queryOne } from './utils/db.js';
import type { ReceiptParseResult, InventoryItem } from '../../src/types/index';

async function parseReceiptWithOpenAI(imageBase64: string): Promise<ReceiptParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      store_name: 'Unknown Store',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      items: [
        { name: 'Sample Item (add OPENAI_API_KEY for real parsing)', quantity: 1, unit: 'each', category: 'other', location: 'pantry' },
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
          content: `You parse grocery receipts. Return ONLY valid JSON with this structure:
{"store_name":"string","date":"YYYY-MM-DD","total":number,"items":[{"name":"string","quantity":number,"unit":"string","price":number,"category":"produce|dairy|meat|pantry|frozen|beverage|other","location":"pantry|fridge|freezer","needs_expiration":boolean,"suggested_expiration":"YYYY-MM-DD or null"}]}
Infer location: dairy/produce/meat->fridge, frozen->freezer, else pantry. Mark milk, eggs, meat, produce as needs_expiration.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Parse this grocery receipt image into inventory items.' },
            { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
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

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content) as ReceiptParseResult;
}

export const handler: Handler = withCors(async (event) => {
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const receipts = store.receipts.filter((r) => r.user_id === userId);
      return jsonResponse({ receipts });
    }
    const receipts = await query('SELECT * FROM receipts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return jsonResponse({ receipts });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ image: string; action?: string; receipt_id?: string }>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.action === 'verify' && body.receipt_id) {
      if (useDevStore()) {
        const store = loadStore();
        const receipt = store.receipts.find((r) => r.id === body.receipt_id && r.user_id === userId);
        if (!receipt) return errorResponse('Receipt not found', 404);
        receipt.verified = true;
        const items = (receipt.raw_parse?.items || []).map((item) => ({
          id: uuidv4(),
          user_id: userId,
          name: item.name,
          category: item.category || 'other',
          quantity: item.quantity || 1,
          unit: item.unit || 'each',
          expiration_date: item.suggested_expiration,
          location: (item.location || 'pantry') as InventoryItem['location'],
          added_via: 'receipt',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        store.inventory_items.push(...items);
        saveStore(store);
        return jsonResponse({ receipt, items_added: items.length });
      }
      return jsonResponse({ message: 'Verify in production DB mode' });
    }

    if (!body.image) return errorResponse('Missing image');

    const parsed = await parseReceiptWithOpenAI(body.image);
    const receiptId = uuidv4();
    const receipt = {
      id: receiptId,
      user_id: userId,
      store_name: parsed.store_name,
      total_amount: parsed.total,
      receipt_date: parsed.date,
      image_data: body.image.slice(0, 200) + '...[truncated]',
      raw_parse: parsed,
      verified: false,
      created_at: new Date().toISOString(),
    };

    if (useDevStore()) {
      const store = loadStore();
      store.receipts.push(receipt);
      saveStore(store);
      return jsonResponse({ receipt, parsed }, 201);
    }

    await query(
      `INSERT INTO receipts (id, user_id, store_name, total_amount, receipt_date, raw_parse, verified)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [receiptId, userId, parsed.store_name, parsed.total, parsed.date, JSON.stringify(parsed)]
    );
    return jsonResponse({ receipt, parsed }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
