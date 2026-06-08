import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, query, queryOne } from './utils/db.js';
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
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const plans = store.meal_plans.filter((p) => p.user_id === userId);
      return jsonResponse({ plans });
    }
    const plans = await query('SELECT * FROM meal_plans WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return jsonResponse({ plans });
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
      inventory = await query('SELECT * FROM inventory_items WHERE user_id = $1', [userId]) as InventoryItem[];
      profile = (await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId])) as Profile;
    }

    if (body.action === 'what-can-i-make') {
      const planData = await generateMealPlan(inventory, profile, { days: 1, message: 'Suggest 3 meals using ONLY what we have in inventory. Minimize missing ingredients.' });
      return jsonResponse({ suggestions: planData });
    }

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

    await query(
      `INSERT INTO meal_plans (id, user_id, title, start_date, end_date, days, budget, status, plan_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)`,
      [planId, userId, plan.title, plan.start_date, plan.end_date, days, body.budget || null, JSON.stringify(planData)]
    );
    return jsonResponse({ plan }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
