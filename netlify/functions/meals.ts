import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse } from './utils/quotas.js';
import { awardXpDevStore, awardXpSupabase, XP_AWARDS } from './utils/gamification.js';
import type { MealPlanData, InventoryItem, Profile, PlannedMeal, ShoppingItem } from '../../src/types/index';

const SYSTEM_PROMPT = `You are a kitchen sous chef meal planner. Return ONLY valid JSON:
{"meals":[{"day":1,"meal_type":"breakfast|lunch|dinner|snack","name":"string","description":"string","ingredients":[{"name":"string","quantity":number,"unit":"string","in_inventory":boolean}],"prep_time_minutes":number}],"shopping_list":[{"name":"string","quantity":number,"unit":"string","estimated_price":number}],"estimated_cost":number,"uses_inventory":["string"]}
Prioritize inventory. Respect dietary restrictions. Keep descriptions short.`;

function normalizeProfile(prof: Partial<Profile> | null | undefined, userId: string): Profile {
  return {
    user_id: userId,
    dietary_restrictions: prof?.dietary_restrictions ?? [],
    cuisine_preferences: prof?.cuisine_preferences ?? [],
    allergies: prof?.allergies ?? [],
    household_size: prof?.household_size ?? 2,
    preferred_store: prof?.preferred_store ?? '',
    gamification_level: prof?.gamification_level ?? 1,
    gamification_xp: prof?.gamification_xp ?? 0,
    onboarding_complete: prof?.onboarding_complete ?? false,
    assistant_name: prof?.assistant_name ?? 'Clara',
    last_meal_memory: (prof?.last_meal_memory as Record<string, unknown>) ?? {},
  };
}

async function loadKitchenContext(userId: string, token: string | undefined) {
  if (useDevStore()) {
    const store = loadStore();
    const inventory = store.inventory_items.filter((i) => i.user_id === userId);
    const raw = store.profiles.find((p) => p.user_id === userId);
    return { inventory, profile: normalizeProfile(raw, userId) };
  }
  if (!token) throw new Error('Missing auth token');
  const db = getSupabaseUserClient(token);
  const { data: items, error: itemsErr } = await db.from('inventory_items').select('*').eq('user_id', userId);
  if (itemsErr) throw new Error(itemsErr.message);
  const { data: prof, error: profErr } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (profErr) throw new Error(profErr.message);
  return { inventory: (items ?? []) as InventoryItem[], profile: normalizeProfile(prof as Partial<Profile>, userId) };
}

function formatInventoryList(inventory: InventoryItem[]): string {
  const lines = inventory.slice(0, 48).map((i) => `${i.name}: ${i.quantity} ${i.unit}`);
  if (inventory.length > 48) lines.push(`…and ${inventory.length - 48} more items`);
  return lines.join('\n') || 'Empty — suggest starter meals and shopping list';
}

function mergePlanChunks(chunks: MealPlanData[]): MealPlanData {
  const meals: PlannedMeal[] = [];
  const shoppingMap = new Map<string, ShoppingItem>();
  let estimatedCost = 0;
  const uses = new Set<string>();

  for (const chunk of chunks) {
    meals.push(...(chunk.meals ?? []));
    for (const item of chunk.shopping_list ?? []) {
      const key = item.name.toLowerCase();
      const existing = shoppingMap.get(key);
      if (existing) {
        existing.quantity = Number(existing.quantity) + Number(item.quantity);
      } else {
        shoppingMap.set(key, { ...item });
      }
    }
    estimatedCost += chunk.estimated_cost ?? 0;
    for (const u of chunk.uses_inventory ?? []) uses.add(u);
  }

  return {
    meals,
    shopping_list: [...shoppingMap.values()],
    estimated_cost: Math.round(estimatedCost * 100) / 100,
    uses_inventory: [...uses],
  };
}

async function callOpenAiMealPlan(userContent: string, maxTokens: number): Promise<MealPlanData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      meals: [{
        day: 1, meal_type: 'dinner', name: 'Grilled Cheese',
        description: 'Quick comfort meal from your pantry',
        ingredients: [
          { name: 'Bread', quantity: 2, unit: 'slices', in_inventory: true },
          { name: 'Cheese', quantity: 2, unit: 'slices', in_inventory: true },
        ],
        prep_time_minutes: 10,
      }],
      shopping_list: [{ name: 'Add OPENAI_API_KEY for full meal planning', quantity: 1, unit: 'each' }],
      estimated_cost: 0,
      uses_inventory: ['Bread', 'Cheese'],
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI meal plan error:', response.status, errText.slice(0, 200));
      throw new Error('Meal planning service unavailable — try again shortly.');
    }
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return JSON.parse(data.choices[0].message.content) as MealPlanData;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Meal planning timed out — try fewer days or dinner-only.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function generateMealPlanChunk(
  inventory: InventoryItem[],
  profile: Profile,
  params: {
    startDay: number;
    dayCount: number;
    budget?: number;
    people?: number;
    message?: string;
    dinnersOnly?: boolean;
    includeShoppingList?: boolean;
  },
): Promise<MealPlanData> {
  const endDay = params.startDay + params.dayCount - 1;
  const inventoryList = formatInventoryList(inventory);
  const mealScope = params.dinnersOnly
    ? 'Plan DINNER ONLY (one dinner per day).'
    : 'Plan breakfast, lunch, and dinner each day.';

  const shoppingNote = params.includeShoppingList
    ? 'Include a consolidated shopping_list for missing ingredients.'
    : 'Return meals only — use an empty shopping_list [].';

  const userContent = `${mealScope} Plan days ${params.startDay} through ${endDay} (${params.dayCount} days).
People: ${params.people || profile.household_size}
Budget: $${params.budget ?? 'flexible'}
Dietary: ${profile.dietary_restrictions.join(', ') || 'none'}
Cuisines: ${profile.cuisine_preferences.join(', ') || 'any'}
Allergies: ${profile.allergies.join(', ') || 'none'}
Inventory:
${inventoryList}
${params.message ? `Chef request: ${params.message}` : ''}
${shoppingNote}
Use "day" field values ${params.startDay} through ${endDay}.`;

  const maxTokens = Math.min(400 + params.dayCount * 180, 1400);
  return callOpenAiMealPlan(userContent, maxTokens);
}

async function generateMealPlan(
  inventory: InventoryItem[],
  profile: Profile,
  params: { days: number; budget?: number; breakfasts?: number; lunches?: number; dinners?: number; people?: number; message?: string },
): Promise<MealPlanData> {
  const days = Math.min(Math.max(params.days, 1), 14);
  const dinnersOnly = days >= 4;
  const chunkSize = days <= 3 ? days : 3;
  const chunks: Promise<MealPlanData>[] = [];

  for (let start = 1; start <= days; start += chunkSize) {
    const dayCount = Math.min(chunkSize, days - start + 1);
    chunks.push(generateMealPlanChunk(inventory, profile, {
      startDay: start,
      dayCount,
      budget: params.budget,
      people: params.people,
      message: params.message,
      dinnersOnly,
      includeShoppingList: start === 1,
    }));
  }

  const results = await Promise.all(chunks);
  return mergePlanChunks(results);
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const plans = store.meal_plans.filter((p) => p.user_id === userId);
      return jsonResponse({ plans });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: plans, error } = await db.from('meal_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ plans: plans ?? [] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      days?: number; budget?: number; breakfasts?: number; lunches?: number;
      dinners?: number; people?: number; message?: string; action?: string; plan_id?: string;
    }>(event);
    if (!body) return errorResponse('Invalid body');

    const { inventory, profile } = await loadKitchenContext(userId, user.token);

    if (body.action === 'what-can-i-make') {
      const planData = await generateMealPlanChunk(inventory, profile, {
        startDay: 1,
        dayCount: 1,
        message: 'Suggest 3 dinner ideas using ONLY inventory. Minimize missing ingredients.',
        dinnersOnly: true,
        includeShoppingList: false,
      });
      return jsonResponse({ suggestions: planData });
    }

    const quota = await checkAndIncrementQuota(userId, 'meal_plans');
    if (!quota.allowed) return quotaErrorResponse(quota.limits, quota.usage);

    const days = Math.min(body.days || 7, 14);
    const planData = await generateMealPlan(inventory, profile, { ...body, days });
    const planId = uuidv4();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const plan = {
      id: planId,
      user_id: userId,
      title: `${days}-Day Meal Plan`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days,
      budget: body.budget,
      status: 'active',
      plan_data: planData,
      created_at: new Date().toISOString(),
    };

    if (useDevStore()) {
      const store = loadStore();
      store.meal_plans.push(plan);
      const pIdx = store.profiles.findIndex((p) => p.user_id === userId);
      if (pIdx >= 0) awardXpDevStore(store, userId, XP_AWARDS.meal_plan);
      saveStore(store);
      return jsonResponse({ plan }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { error: insertErr } = await db.from('meal_plans').insert({
      id: planId,
      user_id: userId,
      title: plan.title,
      start_date: plan.start_date,
      end_date: plan.end_date,
      days,
      budget: body.budget || null,
      status: 'active',
      plan_data: planData,
    });
    if (insertErr) return errorResponse(insertErr.message, 500);
    const xp = await awardXpSupabase(db, userId, XP_AWARDS.meal_plan);
    return jsonResponse({ plan, xp_gained: xp.gained }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
