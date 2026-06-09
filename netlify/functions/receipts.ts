import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse } from './utils/quotas.js';
import { awardXpDevStore, awardXpSupabase, XP_AWARDS } from './utils/gamification.js';
import { runBrainSyncDevStore, runBrainSyncSupabase, getBrainScopeDevStore, getBrainScopeSupabase } from './utils/brain/runBrainSync.js';
import type { ReceiptParseResult, InventoryItem } from '../../src/types/index';
import { normalizeScanItem } from './utils/inventoryNormalize.js';

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
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const receipts = store.receipts.filter((r) => r.user_id === userId);
      return jsonResponse({ receipts });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: receipts } = await db.from('receipts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return jsonResponse({ receipts: receipts ?? [] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ image: string; action?: string; receipt_id?: string; items?: ReceiptParseResult['items'] }>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.action === 'verify' && body.receipt_id) {
      if (useDevStore()) {
        const store = loadStore();
        const receipt = store.receipts.find((r) => r.id === body.receipt_id && r.user_id === userId);
        if (!receipt) return errorResponse('Receipt not found', 404);
        receipt.verified = true;
        const sourceItems = body.items ?? receipt.raw_parse?.items ?? [];
        const items = sourceItems.map((item) => {
          const normalized = normalizeScanItem(
            {
              ...item,
              suggested_expiration: item.suggested_expiration,
              needs_expiration: item.needs_expiration,
            },
            'receipt',
          );
          return {
            id: uuidv4(),
            user_id: userId,
            name: normalized.name,
            category: normalized.category,
            quantity: normalized.quantity,
            unit: normalized.unit,
            expiration_date: normalized.expiration_date ?? undefined,
            location: normalized.location,
            added_via: 'receipt',
            knowledge_id: normalized.knowledge_id,
            estimated_unit_price: item.price ? Number(item.price) / Math.max(1, Number(item.quantity || 1)) : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });
        store.inventory_items.push(...items);
        if (body.items) receipt.raw_parse = { ...receipt.raw_parse, items: body.items } as ReceiptParseResult;
        const xp = awardXpDevStore(store, userId, XP_AWARDS.receipt_verify);
        const scope = getBrainScopeDevStore(store, userId);
        runBrainSyncDevStore(store, scope);
        saveStore(store);
        return jsonResponse({ receipt, items_added: items.length, xp_gained: xp?.gained ?? XP_AWARDS.receipt_verify });
      }
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: receipt } = await db.from('receipts').select('*').eq('id', body.receipt_id).eq('user_id', userId).single();
      if (!receipt) return errorResponse('Receipt not found', 404);
      const parsed = receipt.raw_parse as ReceiptParseResult;
      const sourceItems = body.items ?? parsed?.items ?? [];
      if (body.items) {
        await db.from('receipts').update({ verified: true, raw_parse: { ...parsed, items: body.items } }).eq('id', body.receipt_id);
      } else {
        await db.from('receipts').update({ verified: true }).eq('id', body.receipt_id);
      }
      const rows = sourceItems.map((item) => {
        const normalized = normalizeScanItem(
          {
            ...item,
            suggested_expiration: item.suggested_expiration,
            needs_expiration: item.needs_expiration,
          },
          'receipt',
        );
        return {
          user_id: userId,
          name: normalized.name,
          category: normalized.category,
          quantity: normalized.quantity,
          unit: normalized.unit,
          expiration_date: normalized.expiration_date,
          location: normalized.location,
          added_via: 'receipt',
          knowledge_id: normalized.knowledge_id ?? null,
          estimated_unit_price: item.price ? Number(item.price) / Math.max(1, Number(item.quantity || 1)) : 0,
        };
      });
      if (rows.length) await db.from('inventory_items').insert(rows);
      const xp = await awardXpSupabase(db, userId, XP_AWARDS.receipt_verify);
      const scope = await getBrainScopeSupabase(db, userId);
      await runBrainSyncSupabase(db, scope);
      return jsonResponse({
        receipt: { ...receipt, verified: true },
        items_added: rows.length,
        xp_gained: xp.gained,
      });
    }

    if (!body.image) return errorResponse('Missing image');

    const quota = await checkAndIncrementQuota(userId, 'receipt_scans');
    if (!quota.allowed) return quotaErrorResponse(quota.limits, quota.usage, quota.credits);

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

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    await db.from('receipts').insert({
      id: receiptId,
      user_id: userId,
      store_name: parsed.store_name,
      total_amount: parsed.total,
      receipt_date: parsed.date,
      raw_parse: parsed,
      verified: false,
    });
    return jsonResponse({ receipt, parsed }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
