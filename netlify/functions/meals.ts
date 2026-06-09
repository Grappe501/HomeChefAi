import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient, useDevStore } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse } from './utils/quotas.js';
import type { MealPlanData, InventoryItem, Profile } from '../../src/types/index';

async function generateMealPlan(
  inventory: InventoryItem[],
  profile: Profile,
  params: { days: number; budget?: number; breakfasts?: number; lunches?: number; dinners?: number; people?: number; message?: string }
): Promise<MealPlanData> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryList = inventory.map((i) => `${i.name}: ${i.quantity} ${i.unit} (${i.location})`).join('\n');

  if (!apiKey) {
    return {
      meals: [
        {
          day: 1, meal_type: 'dinner', name: 'Grilled Cheese',
          description: 'Quick comfort meal from your pantry',
          ingredients: [
            { name: 'Bread', quantity: 2, unit: 'slices', in_inventory: true },
            { name: 'Cheese', quantity: 2, unit: 'slices', in_inventory: true },
            { name: 'Butter', quantity: 1, unit: 'tbsp', in_inventory: true },
          ],
          prep_time_minutes: 10,
        },
      ],
      shopping_list: [{ name: 'Add OPENAI_API_KEY for full meal planning', quantity: 1, unit: 'each' }],
      estimated_cost: 0,
      uses_inventory: ['Bread', 'Cheese', 'Butter'],
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
          content: `You are a kitchen sous chef meal planner. Return ONLY valid JSON:
{"meals":[{"day":1,"meal_type":"breakfast|lunch|dinner|snack","name":"string","description":"string","ingredients":[{"name":"string","quantity":number,"unit":"string","in_inventory":boolean}],"prep_time_minutes":number}],"shopping_list":[{"name":"string","quantity":number,"unit":"string","estimated_price":number}],"estimated_cost":number,"uses_inventory":["string"]}
Prioritize using inventory items. Respect dietary restrictions. Keep questions minimal — infer reasonable defaults.`,
        },
        {
          role: 'user',
          content: `Plan ${params.days} days of meals.
People: ${params.people || profile.household_size}
Budget: $${params.budget || 'flexible'}
Breakfasts/day: ${params.breakfasts ?? 1}, Lunches/day: ${params.lunches ?? 1}, Dinners/day: ${params.dinners ?? 1}
Dietary: ${profile.dietary_restrictions.join(', ') || 'none'}
Cuisines: ${profile.cuisine_preferences.join(', ') || 'any'}
Allergies: ${profile.allergies.join(', ') || 'none'}
Preferred store: ${profile.preferred_store}
Current inventory:
${inventoryList || 'Empty — suggest starter meals and shopping list'}
${params.message ? `User request: ${params.message}` : ''}`,
        },
      ],
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('Meal planning failed');
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content) as MealPlanData;
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
    const { data: plans } = await db.from('meal_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return jsonResponse({ plans: plans ?? [] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      days?: number; budget?: number; breakfasts?: number; lunches?: number;
      dinners?: number; people?: number; message?: string; action?: string; plan_id?: string;
    }>(event);
    if (!body) return errorResponse('Invalid body');

    let inventory: InventoryItem[] = [];
    let profile: Profile;

    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === userId);
      profile = store.profiles.find((p) => p.user_id === userId)!;
    } else {
      if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
      const { data: items } = await db.from('inventory_items').select('*').eq('user_id', userId);
      inventory = (items ?? []) as InventoryItem[];
      const { data: prof } = await db.from('profiles').select('*').eq('user_id', userId).single();
      profile = prof as Profile;
    }

    if (body.action === 'what-can-i-make') {
      const planData = await generateMealPlan(inventory, profile, { days: 1, message: 'Suggest 3 meals using ONLY what we have in inventory. Minimize missing ingredients.' });
      return jsonResponse({ suggestions: planData });
    }

    const quota = await checkAndIncrementQuota(userId, 'meal_plans');
    if (!quota.allowed) return quotaErrorResponse(quota.limits, quota.usage);

    const days = body.days || 7;
    const planData = await generateMealPlan(inventory, profile, body);
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
      if (pIdx >= 0) {
        store.profiles[pIdx].gamification_xp += 50;
        if (store.profiles[pIdx].gamification_xp >= 100 && store.profiles[pIdx].gamification_level < 2) {
          store.profiles[pIdx].gamification_level = 2;
        }
        if (store.profiles[pIdx].gamification_xp >= 300 && store.profiles[pIdx].gamification_level < 3) {
          store.profiles[pIdx].gamification_level = 3;
        }
      }
      saveStore(store);
      return jsonResponse({ plan }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    await db.from('meal_plans').insert({
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
    return jsonResponse({ plan }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
