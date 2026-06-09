import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse } from './utils/quotas.js';
import { awardXpDevStore, awardXpSupabase, XP_AWARDS } from './utils/gamification.js';
import type { MealPlanData, InventoryItem, Profile, PlannedMeal, ShoppingItem } from '../../src/types/index';
import { computePlanMetrics } from './utils/planMetrics.js';
import { formatInventoryForAI, formatInventorySummary } from './utils/inventoryContext.js';
import { enrichMealsWithIntelligence, buildMealIntelligence } from './utils/ai/mealExplain.js';
import {
  persistMealPlanReview,
  getRecentLedger,
  formatLedgerSummaryForPlanner,
  logGenerationToLedger,
} from './utils/ai/ledgerStore.js';
import type { MealReviewPayload } from './utils/ai/decisionLedger.js';
import { buildMealDirections, findDirectionById, formatDirectionsForPrompt } from './utils/ai/reasoning.js';
import { mealTagsForPlanContext } from './utils/ai/orchestrator.js';

type MealCounts = { breakfasts: number; lunches: number; dinners: number; snacks: number };

const SYSTEM_PROMPT = `You are a kitchen sous chef meal planner. Return ONLY valid JSON:
{"meals":[{"day":1,"meal_type":"breakfast|lunch|dinner|snack","name":"string","description":"string","ingredients":[{"name":"string","quantity":number,"unit":"string","in_inventory":boolean}],"prep_time_minutes":number,"tags":["weeknight|30_minutes|leftovers_friendly|easy_night|..."]}],"shopping_list":[{"name":"string","quantity":number,"unit":"string","estimated_price":number,"supply_group":"breakfast|lunch|dinner|snack|staple"}],"estimated_cost":number,"uses_inventory":["string"]}
Prioritize inventory. Respect dietary restrictions. Keep breakfast/lunch entries concise.
Plan ONLY the meal counts requested — do not add extra meals.
Tag meals when appropriate: weeknight, 30_minutes, leftovers_friendly, easy_night, crowd_favorite, freezer_friendly.
Tag each shopping_list item with supply_group.`;

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
  return formatInventoryForAI(inventory);
}

function totalMeals(counts: MealCounts): number {
  return counts.breakfasts + counts.lunches + counts.dinners + counts.snacks;
}

function chunkMealCounts(counts: MealCounts, startDay: number, dayCount: number, planDays: number): MealCounts {
  const alloc = (total: number) => {
    if (total <= 0) return 0;
    if (total === planDays) return dayCount;
    const endDay = startDay + dayCount - 1;
    const allocatedBefore = Math.round(((startDay - 1) / planDays) * total);
    const allocatedThrough = Math.round((endDay / planDays) * total);
    return Math.max(0, allocatedThrough - allocatedBefore);
  };
  return {
    breakfasts: alloc(counts.breakfasts),
    lunches: alloc(counts.lunches),
    dinners: alloc(counts.dinners),
    snacks: alloc(counts.snacks),
  };
}

function chunkSizeForCoverage(counts: MealCounts, planDays: number): number {
  const perDay = totalMeals(counts) / Math.max(planDays, 1);
  if (perDay >= 3) return 1;
  if (perDay >= 2) return 2;
  return 3;
}

function buildMealScopePrompt(counts: MealCounts, startDay: number, dayCount: number, planDays: number): string {
  const chunk = chunkMealCounts(counts, startDay, dayCount, planDays);
  const endDay = startDay + dayCount - 1;
  const lines: string[] = [`Plan meals for days ${startDay} through ${endDay} (${dayCount} days).`];

  const add = (type: string, n: number) => {
    if (n <= 0) return;
    const spread =
      n === dayCount
        ? `one ${type} per day on each of these days`
        : `${n} ${type}${n === 1 ? '' : 's'} spread across these days`;
    lines.push(`- Exactly ${n} ${type}${n === 1 ? '' : 's'} (${spread}).`);
  };

  add('breakfast', chunk.breakfasts);
  add('lunch', chunk.lunches);
  add('dinner', chunk.dinners);
  add('snack', chunk.snacks);

  lines.push('Use correct meal_type values: breakfast, lunch, dinner, snack.');
  return lines.join('\n');
}

function planningGoalPrompt(goal?: string): string {
  const map: Record<string, string> = {
    save_money: 'Prioritize budget-friendly ingredients and minimize waste.',
    use_inventory: 'Maximize use of current pantry inventory before suggesting purchases.',
    pantry_challenge: 'Pantry Challenge: use inventory first, minimize grocery spend, reduce waste.',
    quick_meals: 'Favor meals under 30 minutes prep time.',
    healthy_light: 'Lean toward lighter, nutritious options.',
    big_family: 'Generous portions suitable for a hungry household.',
    variety: 'Avoid repeating the same proteins or cuisines back-to-back.',
    kid_friendly: 'Include approachable, family-friendly options.',
  };
  return goal ? map[goal] ?? '' : '';
}

function resolveMealCounts(
  days: number,
  body: { breakfasts?: number; lunches?: number; dinners?: number; snacks?: number },
): MealCounts {
  const hasExplicit =
    body.breakfasts != null || body.lunches != null || body.dinners != null || body.snacks != null;
  if (!hasExplicit) {
    return { breakfasts: 0, lunches: 0, dinners: days, snacks: 0 };
  }
  return {
    breakfasts: Math.max(0, body.breakfasts ?? 0),
    lunches: Math.max(0, body.lunches ?? 0),
    dinners: Math.max(0, body.dinners ?? 0),
    snacks: Math.max(0, body.snacks ?? 0),
  };
}

function cookingStylePrompt(style: string | undefined, profile: Profile): string {
  if (!style || style === 'profile_default') {
    const c = profile.cuisine_preferences?.join(', ');
    return c ? `Cooking style from profile: ${c}.` : 'General American home cooking.';
  }
  const map: Record<string, string> = {
    comfort: 'Comfort food — hearty, familiar, satisfying.',
    southern: 'Southern home cooking.',
    cajun: 'Cajun / Creole — bold spice, Louisiana flavors.',
    italian: 'Italian home cooking.',
    mexican: 'Mexican — beans, rice, chiles, tortillas.',
    asian: 'Asian-inspired flavors.',
    bbq_smoked: 'BBQ & smoked — grilled, smoky flavors.',
    homestead: 'Homestead — from-scratch, pantry staples.',
    meal_prep: 'Meal prep — batch-friendly, stores well.',
    entertaining: 'Entertaining — crowd-pleasing dishes.',
  };
  return map[style] ?? style;
}

function cookNightsPrompt(cookNights: number | undefined, dinnerSlots: number): string {
  const cook = cookNights ?? dinnerSlots;
  if (dinnerSlots <= 0 || cook >= dinnerSlots) {
    return 'Every dinner slot is a home-cooked meal.';
  }
  const easy = dinnerSlots - cook;
  return `Of ${dinnerSlots} dinner slots: exactly ${cook} home-cooked dinners. The other ${easy} slot(s) are easy nights — "Leftover night", "Sandwich night", "Soup night", "Pizza night", or "Free night". Tag easy nights with easy_night.`;
}

function buildRealismPrompt(planningGoal: string | undefined, counts: MealCounts): string {
  if (planningGoal === 'variety') {
    return 'Chef requested maximum variety — unique meals across the plan where practical.';
  }
  const lines = ['Household realism (default):'];
  if (counts.breakfasts > 0) {
    lines.push('- Breakfasts: rotate 2–4 simple repeat options (e.g. oatmeal, eggs, toast). Do NOT invent a unique breakfast for every day unless fewer than 4 breakfasts total.');
  }
  if (counts.lunches > 0) {
    lines.push('- Lunches: at least half must be leftovers from a prior dinner in this plan. Prefix the name with "Leftover" (e.g. "Leftover BBQ chicken bowl").');
  }
  if (counts.dinners > 0) {
    lines.push('- Dinners: vary proteins and cuisines across the week.');
  }
  lines.push('- Scale ingredient quantities for the household size given.');
  return lines.join('\n');
}

function maxTokensForChunk(chunkMeals: number, chunkCounts: MealCounts): number {
  const lightMeals = chunkCounts.breakfasts + chunkCounts.lunches + chunkCounts.snacks;
  const perMeal = lightMeals > 0 && chunkCounts.dinners === 0 ? 75 : 100;
  const cap = chunkMeals > 10 ? 1100 : 1600;
  return Math.min(320 + chunkMeals * perMeal, cap);
}

function mergePlanChunks(chunks: MealPlanData[]): MealPlanData {
  const meals: PlannedMeal[] = [];
  const shoppingMap = new Map<string, ShoppingItem>();
  const itemGroups = new Map<string, Set<string>>();
  let estimatedCost = 0;
  const uses = new Set<string>();

  for (const chunk of chunks) {
    meals.push(...(chunk.meals ?? []));
    for (const item of chunk.shopping_list ?? []) {
      const group = item.supply_group ?? 'staple';
      const nameKey = item.name.toLowerCase();
      const groups = itemGroups.get(nameKey) ?? new Set();
      groups.add(group);
      itemGroups.set(nameKey, groups);

      const key = `${nameKey}::${group}`;
      const existing = shoppingMap.get(key);
      if (existing) {
        existing.quantity = Number(existing.quantity) + Number(item.quantity);
      } else {
        shoppingMap.set(key, { ...item, supply_group: group as ShoppingItem['supply_group'] });
      }
    }
    estimatedCost += chunk.estimated_cost ?? 0;
    for (const u of chunk.uses_inventory ?? []) uses.add(u);
  }

  const shopping_list = [...shoppingMap.values()].map((item) => {
    const groups = itemGroups.get(item.name.toLowerCase());
    if (groups && groups.size > 1) return { ...item, supply_group: 'staple' as const };
    return item;
  });

  meals.sort((a, b) => a.day - b.day || mealTypeOrder(a.meal_type) - mealTypeOrder(b.meal_type));

  return {
    meals,
    shopping_list,
    estimated_cost: Math.round(estimatedCost * 100) / 100,
    uses_inventory: [...uses],
  };
}

function mealTypeOrder(type: string): number {
  const order: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return order[type] ?? 9;
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
      throw new Error('Meal planning timed out — try fewer days or dinners-only.');
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
    planDays: number;
    mealCounts: MealCounts;
    budget?: number;
    people?: number;
    message?: string;
    planningGoal?: string;
    cookingStyle?: string;
    cookNights?: number;
    includeShoppingList?: boolean;
    fullPlanCounts?: MealCounts;
    ledgerFeedback?: string;
    directionPrompt?: string;
  },
): Promise<MealPlanData> {
  const inventoryList = formatInventoryList(inventory);
  const mealScope = buildMealScopePrompt(params.mealCounts, params.startDay, params.dayCount, params.planDays);
  const goalLine = planningGoalPrompt(params.planningGoal);
  const realismLine = buildRealismPrompt(params.planningGoal, params.fullPlanCounts ?? params.mealCounts);
  const styleLine = cookingStylePrompt(params.cookingStyle, profile);
  const dinnerSlots = params.fullPlanCounts?.dinners ?? params.mealCounts.dinners;
  const cookLine = cookNightsPrompt(params.cookNights, dinnerSlots);
  const people = params.people || profile.household_size;

  const shoppingNote = params.includeShoppingList
    ? 'Include shopping_list for missing ingredients with supply_group tags (breakfast/lunch/dinner/snack/staple).'
    : 'Return meals only — use an empty shopping_list [].';

  const chunkCounts = chunkMealCounts(params.mealCounts, params.startDay, params.dayCount, params.planDays);
  const chunkMeals = totalMeals(chunkCounts);

  const enforcedTags = mealTagsForPlanContext({
    planning_goal: params.planningGoal,
    cooking_style: params.cookingStyle,
  });

  const userContent = `${mealScope}
Household: Plan all portions for exactly ${people} people.
Budget: $${params.budget ?? 'flexible'}
Dietary: ${profile.dietary_restrictions.join(', ') || 'none'}
Cuisines: ${profile.cuisine_preferences.join(', ') || 'any'}
Allergies: ${profile.allergies.join(', ') || 'none'}
${goalLine ? `Planning goal: ${goalLine}` : ''}
${styleLine}
${realismLine}
${cookLine}
Inventory:
${inventoryList}
(${formatInventorySummary(inventory)})
${params.message ? `Chef request: ${params.message}` : ''}
${params.directionPrompt ? `\nSelected cooking direction:\n${params.directionPrompt}` : ''}
${params.ledgerFeedback ? `\n${params.ledgerFeedback}` : ''}
${shoppingNote}
Use "day" field values ${params.startDay} through ${params.startDay + params.dayCount - 1}.
Prefer these meal tags where appropriate: ${enforcedTags.join(', ')}.`;

  const maxTokens = maxTokensForChunk(chunkMeals, chunkCounts);
  return callOpenAiMealPlan(userContent, maxTokens);
}

async function generateHeavyMealPlan(
  inventory: InventoryItem[],
  profile: Profile,
  params: {
    days: number;
    mealCounts: MealCounts;
    budget?: number;
    people?: number;
    message?: string;
    planning_goal?: string;
    cooking_style?: string;
    cook_nights?: number;
    ledgerFeedback?: string;
    direction_id?: string;
    directionPrompt?: string;
  },
): Promise<MealPlanData> {
  const { days, mealCounts } = params;
  const directionPrompt = params.directionPrompt ?? (
    params.direction_id
      ? (() => {
          const dir = findDirectionById(inventory, profile, params.direction_id!, params.cooking_style);
          return dir ? formatDirectionsForPrompt(dir) : undefined;
        })()
      : undefined
  );
  const tasks: Promise<MealPlanData>[] = [];
  const shared = {
    budget: params.budget,
    people: params.people,
    message: params.message,
    planningGoal: params.planning_goal,
    cookingStyle: params.cooking_style,
    cookNights: params.cook_nights,
    fullPlanCounts: mealCounts,
    ledgerFeedback: params.ledgerFeedback,
    directionPrompt,
  };

  if (mealCounts.breakfasts > 0) {
    tasks.push(generateMealPlanChunk(inventory, profile, {
      ...shared,
      startDay: 1,
      dayCount: days,
      planDays: days,
      mealCounts: { breakfasts: mealCounts.breakfasts, lunches: 0, dinners: 0, snacks: 0 },
      includeShoppingList: true,
    }));
  }
  if (mealCounts.lunches > 0) {
    tasks.push(generateMealPlanChunk(inventory, profile, {
      ...shared,
      startDay: 1,
      dayCount: days,
      planDays: days,
      mealCounts: { breakfasts: 0, lunches: mealCounts.lunches, dinners: 0, snacks: 0 },
      includeShoppingList: true,
    }));
  }
  if (mealCounts.snacks > 0) {
    tasks.push(generateMealPlanChunk(inventory, profile, {
      ...shared,
      startDay: 1,
      dayCount: days,
      planDays: days,
      mealCounts: { breakfasts: 0, lunches: 0, dinners: 0, snacks: mealCounts.snacks },
      includeShoppingList: true,
    }));
  }
  if (mealCounts.dinners > 0) {
    const chunkSize = 3;
    for (let start = 1; start <= days; start += chunkSize) {
      const dayCount = Math.min(chunkSize, days - start + 1);
      const dinnerSlice: MealCounts = {
        breakfasts: 0,
        lunches: 0,
        dinners: chunkMealCounts(mealCounts, start, dayCount, days).dinners,
        snacks: 0,
      };
      if (dinnerSlice.dinners > 0) {
        tasks.push(generateMealPlanChunk(inventory, profile, {
          ...shared,
          startDay: start,
          dayCount,
          planDays: days,
          mealCounts: dinnerSlice,
          includeShoppingList: true,
        }));
      }
    }
  }

  const results = await Promise.all(tasks);
  return mergePlanChunks(results);
}

async function generateMealPlan(
  inventory: InventoryItem[],
  profile: Profile,
  params: {
    days: number;
    budget?: number;
    breakfasts?: number;
    lunches?: number;
    dinners?: number;
    snacks?: number;
    people?: number;
    message?: string;
    planning_goal?: string;
    cooking_style?: string;
    cook_nights?: number;
    ledgerFeedback?: string;
    direction_id?: string;
    directionPrompt?: string;
  },
): Promise<MealPlanData> {
  const days = Math.min(Math.max(params.days, 1), 14);
  const mealCounts = resolveMealCounts(days, params);
  const directionPrompt = params.directionPrompt ?? (
    params.direction_id
      ? (() => {
          const dir = findDirectionById(inventory, profile, params.direction_id!, params.cooking_style);
          return dir ? formatDirectionsForPrompt(dir) : undefined;
        })()
      : undefined
  );

  if (totalMeals(mealCounts) > 12) {
    return generateHeavyMealPlan(inventory, profile, { ...params, days, mealCounts, directionPrompt });
  }

  const chunkSize = Math.min(chunkSizeForCoverage(mealCounts, days), days);
  const chunks: Promise<MealPlanData>[] = [];

  for (let start = 1; start <= days; start += chunkSize) {
    const dayCount = Math.min(chunkSize, days - start + 1);
    chunks.push(generateMealPlanChunk(inventory, profile, {
      startDay: start,
      dayCount,
      planDays: days,
      mealCounts,
      budget: params.budget,
      people: params.people,
      message: params.message,
      planningGoal: params.planning_goal,
      cookingStyle: params.cooking_style,
      cookNights: params.cook_nights,
      includeShoppingList: start === 1,
      fullPlanCounts: mealCounts,
      ledgerFeedback: params.ledgerFeedback,
      directionPrompt,
    }));
  }

  const results = await Promise.all(chunks);
  return mergePlanChunks(results);
}

function formatPlanTitle(days: number, counts: MealCounts): string {
  const parts: string[] = [];
  if (counts.breakfasts) parts.push(`${counts.breakfasts} breakfasts`);
  if (counts.lunches) parts.push(`${counts.lunches} lunches`);
  if (counts.dinners) parts.push(`${counts.dinners} dinners`);
  if (counts.snacks) parts.push(`${counts.snacks} snacks`);
  const coverage = parts.length ? parts.join(', ') : `${days} dinners`;
  return `${days}-Day Plan · ${coverage}`;
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
      dinners?: number; snacks?: number; people?: number; message?: string;
      planning_goal?: string; coverage_preset?: string;
      cooking_style?: string; cook_nights?: number;
      action?: string; plan_id?: string;
      mode?: string; direction_id?: string;
    }>(event);
    if (!body) return errorResponse('Invalid body');

    const { inventory, profile } = await loadKitchenContext(userId, user.token);

    if (body.mode === 'directions' || body.action === 'directions') {
      const result = buildMealDirections(inventory, profile, {
        count: 3,
        cooking_style: body.cooking_style,
      });
      await logGenerationToLedger(
        userId,
        user.token,
        `generation:directions:${Date.now()}`,
        {
          domain: 'meal_plan',
          recommendation: result.directions.map((d) => d.title).join(' · ') || 'directions',
          why: result.reasoning_note,
          evidence: result.directions.flatMap((d) => d.evidence).slice(0, 12),
          confidence: result.directions[0]?.confidence ?? 0.7,
          expert_ids: ['executive_chef', 'flavor_architect'],
          metadata: { mode: 'directions', direction_count: result.directions.length },
        },
        profile.household_id,
      );
      return jsonResponse(result);
    }

    if (body.action === 'what-can-i-make') {
      const directions = buildMealDirections(inventory, profile, { count: 3 });
      if (directions.directions.length >= 2) {
        return jsonResponse({
          directions: directions.directions,
          inventory_summary: directions.inventory_summary,
          reasoning_note: directions.reasoning_note,
        });
      }
      const planData = await generateMealPlanChunk(inventory, profile, {
        startDay: 1,
        dayCount: 1,
        planDays: 1,
        mealCounts: { breakfasts: 0, lunches: 0, dinners: 3, snacks: 0 },
        message: 'Suggest 3 dinner ideas using ONLY inventory. Minimize missing ingredients.',
        includeShoppingList: false,
      });
      return jsonResponse({ suggestions: enrichMealsWithIntelligence(planData, inventory, profile) });
    }

    if (body.action === 'explain-meal') {
      const meal = (body as { meal?: PlannedMeal }).meal;
      if (!meal) return errorResponse('meal required', 400);
      const recentLedger = await getRecentLedger(userId, user.token, 'meal_plan', 20);
      const allMeals = (body as { all_meals?: PlannedMeal[] }).all_meals;
      const intelligence = buildMealIntelligence({
        meal,
        inventory,
        profile,
        coverage: (body as { coverage?: MealPlanData['coverage'] }).coverage,
        metrics: (body as { metrics?: MealPlanData['metrics'] }).metrics,
        allMeals,
        ledgerEntries: recentLedger,
      });
      return jsonResponse({ intelligence });
    }

    if (body.action === 'replace-meal') {
      const raw = body as {
        plan_id: string;
        meal_key: string;
        meal_name: string;
        day: number;
        meal_type: string;
        meal?: PlannedMeal;
      };
      if (!raw.plan_id || !raw.meal_key || !raw.meal_name || !raw.day || !raw.meal_type) {
        return errorResponse('plan_id, meal_key, meal_name, day, meal_type required', 400);
      }

      const recentLedger = await getRecentLedger(userId, user.token, 'meal_plan', 20);
      const ledgerFeedback = formatLedgerSummaryForPlanner(recentLedger);

      let plan: import('../../src/types/index').MealPlan;
      if (useDevStore()) {
        const store = loadStore();
        const idx = store.meal_plans.findIndex((p) => p.id === raw.plan_id && p.user_id === userId);
        if (idx < 0) return errorResponse('Meal plan not found', 404);
        plan = store.meal_plans[idx];
      } else {
        if (!user.token) return errorResponse('Missing token', 401);
        const db = getSupabaseUserClient(user.token);
        const { data, error } = await db.from('meal_plans').select('*').eq('id', raw.plan_id).eq('user_id', userId).single();
        if (error || !data) return errorResponse('Meal plan not found', 404);
        plan = data as import('../../src/types/index').MealPlan;
      }

      const mealCounts: MealCounts = {
        breakfasts: raw.meal_type === 'breakfast' ? 1 : 0,
        lunches: raw.meal_type === 'lunch' ? 1 : 0,
        dinners: raw.meal_type === 'dinner' ? 1 : 0,
        snacks: raw.meal_type === 'snack' ? 1 : 0,
      };

      const chunk = await generateMealPlanChunk(inventory, profile, {
        startDay: raw.day,
        dayCount: 1,
        planDays: plan.days,
        mealCounts,
        message: `Replace "${raw.meal_name}" with a completely different ${raw.meal_type}. Avoid similar name, protein, and cuisine. Chef rejected the previous suggestion.`,
        ledgerFeedback,
        includeShoppingList: false,
        fullPlanCounts: plan.plan_data.coverage ?? mealCounts,
      });

      const replacement = chunk.meals?.[0];
      if (!replacement) return errorResponse('Could not generate replacement meal', 500);

      const meals = [...(plan.plan_data.meals ?? [])];
      const mealIndex = meals.findIndex((m, i) => `${m.day}-${m.meal_type}-${i}` === raw.meal_key);
      if (mealIndex < 0) return errorResponse('Meal slot not found in plan', 404);

      meals[mealIndex] = {
        ...replacement,
        day: raw.day,
        meal_type: raw.meal_type as PlannedMeal['meal_type'],
      };

      const updatedPlanData = enrichMealsWithIntelligence(
        { ...plan.plan_data, meals },
        inventory,
        profile,
        recentLedger,
      );

      const updatedPlan = { ...plan, plan_data: updatedPlanData };

      if (useDevStore()) {
        const store = loadStore();
        const idx = store.meal_plans.findIndex((p) => p.id === raw.plan_id);
        if (idx >= 0) store.meal_plans[idx] = updatedPlan;
        saveStore(store);
      } else if (user.token) {
        const db = getSupabaseUserClient(user.token);
        await db.from('meal_plans').update({ plan_data: updatedPlanData }).eq('id', raw.plan_id).eq('user_id', userId);
      }

      const reviewResult = await persistMealPlanReview(
        userId,
        user.token,
        {
          plan_id: raw.plan_id,
          meal_key: raw.meal_key,
          meal_name: raw.meal_name,
          day: raw.day,
          meal_type: raw.meal_type,
          action: 'replace',
          meal: raw.meal,
        },
        profile.household_id,
      );

      return jsonResponse({
        plan: reviewResult.plan,
        replaced_meal: meals[mealIndex],
      });
    }

    if (body.action === 'review-meal') {
      const raw = body as MealReviewPayload & { meal?: PlannedMeal; review_action?: 'keep' | 'replace' };
      const review: MealReviewPayload & { meal?: PlannedMeal } = {
        ...raw,
        action: raw.review_action ?? raw.action,
      };
      if (!review.plan_id || !review.meal_key || !review.action || !review.meal_name) {
        return errorResponse('plan_id, meal_key, meal_name, and review_action required', 400);
      }
      const result = await persistMealPlanReview(
        userId,
        user.token,
        review,
        profile.household_id,
      );
      return jsonResponse(result);
    }

    const days = Math.min(body.days || 7, 14);
    const quota = await checkAndIncrementQuota(userId, 'meal_plans', { planDays: days });
    if (!quota.allowed) return quotaErrorResponse(quota.limits, quota.usage, quota.credits);

    const recentLedger = await getRecentLedger(userId, user.token, 'meal_plan', 15);
    const ledgerFeedback = formatLedgerSummaryForPlanner(recentLedger);

    const mealCounts = resolveMealCounts(days, body);
    const planData = await generateMealPlan(inventory, profile, { ...body, days, ledgerFeedback });
    const metrics = computePlanMetrics(planData, inventory);
    planData.metrics = {
      inventory_utilization_score: metrics.inventory_utilization_score,
      waste_prevention_score: metrics.waste_prevention_score,
      estimated_grocery_cost: metrics.estimated_grocery_cost,
      expiring_items_used: metrics.expiring_items_used,
      expiring_items_total: metrics.expiring_items_total,
    };
    planData.coverage = {
      ...mealCounts,
      people: body.people ?? profile.household_size,
      planning_goal: body.planning_goal,
      cooking_style: body.cooking_style,
      cook_nights: body.cook_nights,
      preset: body.coverage_preset,
    };
    const enrichedPlanData = enrichMealsWithIntelligence(planData, inventory, profile, recentLedger);
    const planId = uuidv4();
    const selectedDirection = body.direction_id
      ? findDirectionById(inventory, profile, body.direction_id, body.cooking_style)
      : undefined;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const plan = {
      id: planId,
      user_id: userId,
      title: formatPlanTitle(days, mealCounts),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days,
      budget: body.budget,
      status: 'active',
      plan_data: enrichedPlanData,
      created_at: new Date().toISOString(),
    };

    await logGenerationToLedger(
      userId,
      user.token,
      `generation:meal_plan:${planId}`,
      {
        domain: 'meal_plan',
        recommendation: plan.title,
        why: selectedDirection
          ? `Plan generated from direction: ${selectedDirection.title} (${selectedDirection.cuisine_label})`
          : `Generated ${days}-day meal plan from pantry and profile preferences.`,
        evidence: [
          ...(selectedDirection?.evidence ?? []),
          ...enrichedPlanData.meals.slice(0, 5).map((m) => `meal:${m.name}`),
        ].slice(0, 12),
        confidence: selectedDirection?.confidence ?? 0.75,
        expert_ids: ['executive_chef', 'budget_analyst', 'flavor_architect'],
        metadata: {
          plan_id: planId,
          direction_id: body.direction_id,
          meal_count: enrichedPlanData.meals.length,
          planning_goal: body.planning_goal,
        },
      },
      profile.household_id,
    );

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
      plan_data: enrichedPlanData,
    });
    if (insertErr) return errorResponse(insertErr.message, 500);
    const xp = await awardXpSupabase(db, userId, XP_AWARDS.meal_plan);
    return jsonResponse({ plan, xp_gained: xp.gained }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
