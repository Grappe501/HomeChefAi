const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions';

import { getAccessToken, refreshAccessToken } from './supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public upgradeRequired?: boolean,
    public limits?: Record<string, number>,
    public usage?: Record<string, number>
  ) {
    super(message);
  }
}

async function api<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
  if (!navigator.onLine) {
    throw new ApiError('You appear to be offline. Check your connection and try again.', 0);
  }

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError('Network error — check your connection and try again.', 0);
  }

  if (res.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return api<T>(endpoint, options, true);
    }
    throw new ApiError('Session expired — please sign in again.', 401);
  }

  const raw = await res.text();

  let data: Record<string, unknown>;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const friendly = raw.trimStart().startsWith('<')
      ? 'Server error — please try again in a moment.'
      : raw.slice(0, 120) || 'Invalid server response';
    throw new ApiError(friendly, res.status);
  }

  if (!res.ok) {
    throw new ApiError(
      (data.error as string) || 'Request failed',
      res.status,
      data.upgrade_required as boolean | undefined,
      data.limits as Record<string, number> | undefined,
      data.usage as Record<string, number> | undefined
    );
  }
  return data as T;
}

export const authApi = {
  bootstrap: () =>
    api<{ user: { id: string; email?: string; name?: string }; profile: Record<string, unknown> }>('auth', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

export const profileApi = {
  get: () => api<{ user: unknown; profile: Record<string, unknown> }>('profile'),
  update: (data: Record<string, unknown>) =>
    api<{ profile: Record<string, unknown> }>('profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const billingApi = {
  status: () => api<import('@/types/billing').UsageQuota & { subscription: unknown }>('billing-status'),
  checkout: (tier: 'plus' | 'pro' | 'family' = 'plus') =>
    api<{ url: string }>('billing-status', { method: 'POST', body: JSON.stringify({ tier }) }),
  portal: () =>
    api<{ url: string }>('billing-status', { method: 'POST', body: JSON.stringify({ action: 'portal' }) }),
};

export const inventoryApi = {
  list: (location?: string) =>
    api<{ items: import('@/types').InventoryItem[] }>(`inventory${location ? `?location=${location}` : ''}`),
  add: (items: Partial<import('@/types').InventoryItem> | Partial<import('@/types').InventoryItem>[]) =>
    api<{ items: import('@/types').InventoryItem[] }>('inventory', { method: 'POST', body: JSON.stringify(items) }),
  update: (item: Partial<import('@/types').InventoryItem> & { id: string }) =>
    api<{ item: import('@/types').InventoryItem }>('inventory', { method: 'PUT', body: JSON.stringify(item) }),
  remove: (id: string) =>
    api<{ success: boolean }>(`inventory?id=${id}`, { method: 'DELETE' }),
};

export const inventoryStewardApi = {
  preview: () =>
    api<{ preview: import('@/types/inventorySteward').StewardPreview }>('inventory-steward'),
  applyDelta: (deltas: import('@/types/inventorySteward').InventoryDelta[]) =>
    api<{ applied: import('@/types/inventorySteward').InventoryDelta[]; items: import('@/types').InventoryItem[]; errors: string[] }>(
      'inventory-steward',
      { method: 'POST', body: JSON.stringify({ action: 'apply-delta', deltas }) },
    ),
  merge: (keep_id: string, merge_ids: string[]) =>
    api<{ item: import('@/types').InventoryItem; removed: string[] }>(
      'inventory-steward',
      { method: 'POST', body: JSON.stringify({ action: 'merge', keep_id, merge_ids }) },
    ),
  audit: (use_ai = false) =>
    api<import('@/types/inventorySteward').StewardAuditResult & { credits_remaining?: number }>(
      'inventory-steward',
      { method: 'POST', body: JSON.stringify({ action: 'audit', use_ai }) },
    ),
};

export const receiptsApi = {
  list: () => api<{ receipts: import('@/types').Receipt[] }>('receipts'),
  scan: (image: string) =>
    api<{ receipt: import('@/types').Receipt; parsed: import('@/types').ReceiptParseResult }>('receipts', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
  verify: (receipt_id: string, items?: import('@/types').ReceiptItem[]) =>
    api<{ receipt: import('@/types').Receipt; items_added: number; xp_gained?: number }>('receipts', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify', receipt_id, items }),
    }),
};

export const mealsApi = {
  list: () => api<{ plans: import('@/types').MealPlan[] }>('meals'),
  plan: (data: Record<string, unknown>) =>
    api<{ plan: import('@/types').MealPlan; xp_gained?: number }>('meals', { method: 'POST', body: JSON.stringify(data) }),
  getDirections: (data?: { cooking_style?: string }) =>
    api<import('@/types/mealDirections').MealDirectionsResult>('meals', {
      method: 'POST',
      body: JSON.stringify({ mode: 'directions', ...data }),
    }),
  whatCanIMake: () =>
    api<
      | { directions: import('@/types/mealDirections').MealDirection[]; inventory_summary: string; reasoning_note: string }
      | { suggestions: import('@/types').MealPlanData }
    >('meals', {
      method: 'POST',
      body: JSON.stringify({ action: 'what-can-i-make' }),
    }),
  recipeIdeas: (params?: { limit?: number; meal_type?: string; course?: string; occasion?: string; cooking_style?: string }) =>
    api<{
      dishes: import('@/types/dish').DishMatch[];
      count: number;
      library_total?: number;
      library_by_course?: Record<string, number>;
      inventory_summary: string;
    }>('meals', {
      method: 'POST',
      body: JSON.stringify({ action: 'recipe-ideas', ...params }),
    }),
  explainMeal: (data: {
    meal: import('@/types').PlannedMeal;
    coverage?: import('@/types').MealPlanData['coverage'];
    metrics?: import('@/types').MealPlanData['metrics'];
    all_meals?: import('@/types').PlannedMeal[];
  }) =>
    api<{ intelligence: import('@/types/mealIntelligence').MealIntelligence }>('meals', {
      method: 'POST',
      body: JSON.stringify({ action: 'explain-meal', ...data }),
    }),
  replaceMeal: (data: {
    plan_id: string;
    meal_key: string;
    meal_name: string;
    day: number;
    meal_type: string;
    meal?: import('@/types').PlannedMeal;
  }) =>
    api<{ plan: import('@/types').MealPlan; replaced_meal: import('@/types').PlannedMeal }>('meals', {
      method: 'POST',
      body: JSON.stringify({ action: 'replace-meal', ...data }),
    }),
  reviewMeal: (data: {
    plan_id: string;
    meal_key: string;
    meal_name: string;
    day: number;
    meal_type: string;
    action: 'keep' | 'replace';
    meal?: import('@/types').PlannedMeal;
  }) =>
    api<{ plan: import('@/types').MealPlan; ledger_entry: Record<string, unknown> }>('meals', {
      method: 'POST',
      body: JSON.stringify({
        action: 'review-meal',
        plan_id: data.plan_id,
        meal_key: data.meal_key,
        meal_name: data.meal_name,
        day: data.day,
        meal_type: data.meal_type,
        review_action: data.action,
        meal: data.meal,
      }),
    }),
};

export const supplyApi = {
  get: () => api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply'),
  sync: (planId?: string) =>
    api<{ list: import('@/types/supplyList').RunningSupplyList; synced?: boolean; plan?: import('@/types').MealPlan }>(
      'supply',
      { method: 'POST', body: JSON.stringify({ action: 'sync-plan', plan_id: planId }) },
    ),
  syncLatest: () =>
    api<{ list: import('@/types/supplyList').RunningSupplyList; synced: boolean; plan?: import('@/types').MealPlan }>(
      'supply?action=sync',
    ),
  save: (list: import('@/types/supplyList').RunningSupplyList) =>
    api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply', {
      method: 'PUT',
      body: JSON.stringify({ list }),
    }),
  addItem: (name: string, quantity = 1, unit = 'each') =>
    api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply', {
      method: 'POST',
      body: JSON.stringify({ action: 'add-item', name, quantity, unit }),
    }),
  toggleItem: (itemId: string, checked?: boolean) =>
    api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-item', item_id: itemId, checked }),
    }),
  removeItem: (itemId: string) =>
    api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply', {
      method: 'POST',
      body: JSON.stringify({ action: 'remove-item', item_id: itemId }),
    }),
  clearChecked: () =>
    api<{ list: import('@/types/supplyList').RunningSupplyList }>('supply', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-checked' }),
    }),
};

export const calendarApi = {
  list: (from?: string) => api<{ events: CalEvent[] }>(`calendar${from ? `?from=${from}` : ''}`),
  complete: (id: string) => api<{ success: boolean }>('calendar', { method: 'POST', body: JSON.stringify({ action: 'complete', id }) }),
  syncMeals: () => api<{ synced: number }>('calendar', { method: 'POST', body: JSON.stringify({ action: 'sync-meals' }) }),
};

export const swapApi = {
  list: (zip: string) => api<{ posts: unknown[] }>(`swap?zip=${zip}`),
  create: (data: { item_name: string; zip_code: string; post_type?: string; message?: string; quantity?: number; unit?: string }) =>
    api<{ post: unknown }>('swap', { method: 'POST', body: JSON.stringify(data) }),
  respond: (post_id: string, message: string) =>
    api<{ response: unknown }>('swap', { method: 'POST', body: JSON.stringify({ action: 'respond', post_id, message }) }),
};

export const suggestionsApi = {
  list: () => api<{ suggestions: { type: string; title: string; message: string; priority: number }[] }>('suggestions'),
};

interface CalEvent {
  id?: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  completed?: boolean;
}

export const usageApi = {
  log: (data: {
    description?: string;
    meal_name?: string;
    items_used: { name: string; quantity: number; unit: string; item_id?: string }[];
    share_recipe?: boolean;
    recipe_public?: boolean;
    technique_ids?: string[];
  }) =>
    api<{ log: { id: string; meal_name?: string }; inventory_updated?: boolean; recipe?: unknown; xp_gained?: number }>(
      'usage',
      { method: 'POST', body: JSON.stringify(data) },
    ),
  list: () => api<{ logs: import('@/types').UsageLog[] }>('usage'),
};

export const learningApi = {
  profile: () =>
    api<{ taste_profile: import('@/types/tasteLearning').TasteProfile; summary: string }>('learning?action=profile'),
  savePreference: (data: import('@/types/tasteLearning').PendingPreference) =>
    api<{ preference: import('@/types/tasteLearning').TastePreferenceEntry; taste_profile: import('@/types/tasteLearning').TasteProfile }>(
      'learning',
      { method: 'POST', body: JSON.stringify({ action: 'save-preference', ...data }) },
    ),
  rateMeal: (data: {
    meal_name: string;
    rating: import('@/types/tasteLearning').MealOutcomeRating;
    usage_log_id?: string;
    notes?: string;
  }) =>
    api<{ outcome: import('@/types/tasteLearning').MealOutcome; taste_profile: import('@/types/tasteLearning').TasteProfile }>(
      'learning',
      { method: 'POST', body: JSON.stringify({ action: 'rate-meal', ...data }) },
    ),
  refreshProfile: () =>
    api<{ taste_profile: import('@/types/tasteLearning').TasteProfile; summary: string }>(
      'learning',
      { method: 'POST', body: JSON.stringify({ action: 'refresh-profile' }) },
    ),
  rhythm: () =>
    api<{
      behavior_profile: import('@/types/behaviorLearning').BehaviorProfile;
      summary: string;
      nudges: import('@/types/behaviorLearning').KitchenRhythmNudge[];
    }>('learning?action=rhythm'),
  skills: () =>
    api<{
      skill_profile: import('@/types/skillLearning').SkillProfile;
      summary: string;
      nudges: import('@/types/skillLearning').SkillGrowthNudge[];
    }>('learning?action=skills'),
  identity: () =>
    api<{
      identity_profile: import('@/types/identityLearning').IdentityProfile;
      summary: string;
      nudges: import('@/types/identityLearning').IdentityNudge[];
    }>('learning?action=identity'),
  full: () =>
    api<{
      taste_profile: import('@/types/tasteLearning').TasteProfile;
      taste_summary: string;
      behavior_profile: import('@/types/behaviorLearning').BehaviorProfile;
      rhythm_summary: string;
      rhythm_nudges: import('@/types/behaviorLearning').KitchenRhythmNudge[];
      skill_profile: import('@/types/skillLearning').SkillProfile;
      skill_summary: string;
      skill_nudges: import('@/types/skillLearning').SkillGrowthNudge[];
      identity_profile: import('@/types/identityLearning').IdentityProfile;
      identity_summary: string;
      identity_nudges: import('@/types/identityLearning').IdentityNudge[];
    }>('learning?action=full'),
  refreshRhythm: () =>
    api<{
      behavior_profile: import('@/types/behaviorLearning').BehaviorProfile;
      summary: string;
      nudges: import('@/types/behaviorLearning').KitchenRhythmNudge[];
    }>('learning', { method: 'POST', body: JSON.stringify({ action: 'refresh-rhythm' }) }),
  refreshSkills: () =>
    api<{
      skill_profile: import('@/types/skillLearning').SkillProfile;
      summary: string;
      nudges: import('@/types/skillLearning').SkillGrowthNudge[];
    }>('learning', { method: 'POST', body: JSON.stringify({ action: 'refresh-skills' }) }),
  refreshIdentity: () =>
    api<{
      identity_profile: import('@/types/identityLearning').IdentityProfile;
      summary: string;
      nudges: import('@/types/identityLearning').IdentityNudge[];
    }>('learning', { method: 'POST', body: JSON.stringify({ action: 'refresh-identity' }) }),
  setTimeBudget: (data: {
    weeknight_max_minutes?: number;
    weekend_project_ok?: boolean;
  }) =>
    api<{ behavior_profile: import('@/types/behaviorLearning').BehaviorProfile }>(
      'learning',
      { method: 'POST', body: JSON.stringify({ action: 'set-time-budget', ...data }) },
    ),
};

export const experienceApi = {
  plan: (data: {
    experience_type: import('@/types/experience').ExperienceType;
    guest_count?: number;
    start_time?: string;
    cuisine_style?: string;
    message?: string;
    use_ai?: boolean;
  }) =>
    api<{ plan: import('@/types/experience').ExperiencePlanResult }>('experience-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const skillsApi = {
  coach: (meal: string, ingredients?: string[]) => {
    const qs = new URLSearchParams({ meal });
    if (ingredients?.length) qs.set('ingredients', ingredients.join(','));
    return api<{ tips: import('@/types/journey').TechniqueCoachTip[]; inferred_technique_ids: string[] }>(
      `skills?${qs.toString()}`,
    );
  },
  listTechniques: () =>
    api<{ techniques: { id: string; name: string; micro_lesson?: string }[] }>('skills?action=list'),
};

export const pantryScanApi = {
  scan: (image: string) =>
    api<{
      parsed: import('@/types/kitchenPredictions').PantryScanResult;
      credit_cost?: number;
      credits_remaining?: number;
    }>('pantry-scan', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
  confirm: (items: import('@/types/kitchenPredictions').PantryScanItem[]) =>
    api<{ items_added: number }>('pantry-scan', {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', items }),
    }),
};

export const cookInferApi = {
  infer: (meal_description: string, force_ai?: boolean) =>
    api<import('@/types/kitchenPredictions').CookInferResult & { credits_remaining?: number }>('cook-infer', {
      method: 'POST',
      body: JSON.stringify({ meal_description, force_ai }),
    }),
};

export type AssistantChatResult = {
  reply: string;
  suggested_items?: { name: string; quantity: number; unit: string }[];
  action?: string;
  pending_preference?: import('@/types/tasteLearning').PendingPreference;
  pending_inventory_deltas?: import('@/types/inventorySteward').PendingInventoryDelta;
  pending_usage?: import('@/types/inventorySteward').PendingUsageConfirm;
  directions?: import('@/types/mealDirections').MealDirection[];
  intent?: string;
  evidence?: string[];
  expert_ids?: string[];
  credit_cost?: number;
  credits_remaining?: number;
  credits_used?: number;
  credits_pool?: number;
  tools_used?: string[];
  agent_steps?: number;
  search_mode?: string;
};

export const assistantApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api<AssistantChatResult>('assistant', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  chatStream: async (
    message: string,
    history: { role: string; content: string }[] | undefined,
    onEvent: (event: Record<string, unknown>) => void,
  ): Promise<AssistantChatResult> => {
    if (!navigator.onLine) {
      throw new ApiError('You appear to be offline. Check your connection and try again.', 0);
    }

    const token = await getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/assistant-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history }),
    });

    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return assistantApi.chatStream(message, history, onEvent);
      throw new ApiError('Session expired — please sign in again.', 401);
    }

    if (!res.ok || !res.body) {
      const raw = await res.text().catch(() => '');
      let data: Record<string, unknown> = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        /* ignore */
      }
      throw new ApiError((data.error as string) || 'Stream request failed', res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let complete: Record<string, unknown> | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';
      for (const chunk of chunks) {
        const line = chunk.trim();
        if (!line.startsWith('data: ')) continue;
        const payload = JSON.parse(line.slice(6)) as Record<string, unknown>;
        onEvent(payload);
        if (payload.type === 'complete') complete = payload;
        if (payload.type === 'error') {
          throw new ApiError(String(payload.message ?? 'Stream failed'), 500);
        }
      }
    }

    if (!complete) throw new ApiError('Stream ended without a reply', 500);
    return complete as AssistantChatResult;
  },
};

export const recipesApi = {
  list: (feed?: boolean) =>
    api<{ recipes: import('@/types/billing').Recipe[] }>(`recipes${feed ? '?feed=public' : ''}`),
  create: (data: Partial<import('@/types/billing').Recipe>) =>
    api<{ recipe: import('@/types/billing').Recipe }>('recipes', { method: 'POST', body: JSON.stringify(data) }),
  like: (id: string) =>
    api<{ liked: boolean }>('recipes', { method: 'POST', body: JSON.stringify({ action: 'like', id }) }),
  save: (id: string) =>
    api<{ saved: boolean }>('recipes', { method: 'POST', body: JSON.stringify({ action: 'save', id }) }),
};

export const householdApi = {
  get: () =>
    api<{ household: import('@/types/platform').Household | null; members: import('@/types/platform').HouseholdMember[] }>('household'),
  create: (displayName: string) =>
    api<{ household: import('@/types/platform').Household; invite_code: string }>('household', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', display_name: displayName }),
    }),
  join: (inviteCode: string) =>
    api<{ household: import('@/types/platform').Household; members: import('@/types/platform').HouseholdMember[] }>('household', {
      method: 'POST',
      body: JSON.stringify({ action: 'join', invite_code: inviteCode }),
    }),
  invite: () =>
    api<{ invite_code: string }>('household', { method: 'POST', body: JSON.stringify({ action: 'invite' }) }),
};

export const brainApi = {
  insights: () =>
    api<{
      insights: import('@/types/brain').BrainInsight[];
      learning: number;
      kitchen_identity?: import('@/types/platform').KitchenIdentity | null;
      inferred_cooking_style?: import('@/types/householdGraph').InferredCookingStyle | null;
    }>('brain'),
  predictions: () =>
    api<import('@/types/kitchenPredictions').KitchenPredictionsResult>('brain?action=predictions'),
  agentTelemetry: (days = 30) =>
    api<{
      telemetry: {
        total_runs: number;
        avg_steps: number;
        avg_latency_ms: number;
        top_tools: { tool: string; count: number }[];
        search_modes: Record<string, number>;
      };
    }>(`brain?action=agent_telemetry&days=${days}`),
  memory: (id: string) =>
    api<{ memory: import('@/types/brain').BrainInsight }>(`brain?id=${id}`),
  getRecentLedger: (domain?: string, limit = 20) =>
    api<{ ledger: Record<string, unknown>[]; count: number }>(
      `brain?action=ledger${domain ? `&domain=${domain}` : ''}&limit=${limit}`,
    ),
  sync: () =>
    api<{ synced: boolean; insights_count: number }>('brain', { method: 'POST', body: JSON.stringify({}) }),
};

export const knowledgeApi = {
  deepCatalog: (kind?: import('@/types/knowledgeDeep').DeepEntryKind) => {
    const qs = new URLSearchParams({ action: 'deep_catalog' });
    if (kind) qs.set('kind', kind);
    return api<{ entries: import('@/types/knowledgeDeep').DeepKnowledgeEntry[]; count: number }>(
      `knowledge?${qs.toString()}`,
    );
  },
  deepSearch: (q: string, limit = 20) =>
    api<{ results: import('@/types/knowledgeDeep').DeepKnowledgeEntry[]; query: string }>(
      `knowledge?action=deep_search&q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
  deep: (id: string) =>
    api<{ entry: import('@/types/knowledgeDeep').DeepKnowledgeEntry }>(
      `knowledge?action=deep&id=${encodeURIComponent(id)}`,
    ),
  academyTracks: () =>
    api<{ tracks: { id: string; title: string; summary: string; track_type?: string; level_count: number; module_count: number }[] }>(
      'knowledge?action=academy_tracks',
    ),
  academyPractice: (trackId: string, levelId: string, moduleId: string) =>
    api<{
      practice: {
        track_id: string;
        track_title: string;
        level_id: string;
        level_title: string;
        module_id: string;
        module_title: string;
        practice_query: string;
        clara_prompt: string;
        dishes: import('@/types/dish').DishMatch[];
        learn_links: { id: string; label: string; kind: string }[];
        teaching: string[];
        time_limit_minutes?: number;
        judge_criteria?: string[];
        show_refs?: string[];
      };
    }>(
      `knowledge?action=academy_practice&track_id=${encodeURIComponent(trackId)}&level_id=${encodeURIComponent(levelId)}&module_id=${encodeURIComponent(moduleId)}`,
    ),
  stats: () => api<{ node_count: number; types: Record<string, number> }>('knowledge?action=stats'),
};

export const siteSearchApi = {
  search: (q: string, limit = 12) =>
    fetch(`${API_BASE}/site-search?q=${encodeURIComponent(q)}&limit=${limit}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new ApiError((data.error as string) || 'Search failed', res.status);
        return data as { results: import('@/types/siteSearch').SiteSearchResult[]; query: string; count: number };
      }),
  index: () =>
    fetch(`${API_BASE}/site-search?action=index`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new ApiError((data.error as string) || 'Index failed', res.status);
        return data as { entries: import('@/types/siteSearch').SiteSearchEntry[]; count: number };
      }),
  ask: (question: string, history: { role: string; content: string }[] = []) =>
    fetch(`${API_BASE}/site-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new ApiError((data.error as string) || 'Ask failed', res.status);
      return data as import('@/types/siteSearch').SiteAskResponse;
    }),
};

export const productJournalApi = {
  list: (params?: { q?: string; note_type?: string; status?: string; tag?: string; related_area?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.note_type) qs.set('note_type', params.note_type);
    if (params?.status) qs.set('status', params.status);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.related_area) qs.set('related_area', params.related_area);
    const query = qs.toString();
    return api<{ notes: import('@/types/productJournal').ProductNote[] }>(`product-journal${query ? `?${query}` : ''}`);
  },
  create: (data: {
    note_type: string;
    title: string;
    body?: string;
    priority?: string;
    related_area?: string;
    tags?: string[];
    brain_version?: string;
  }) =>
    api<{ note: import('@/types/productJournal').ProductNote }>('product-journal', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...data }),
    }),
  update: (note_id: string, data: Record<string, unknown>) =>
    api<{ note: import('@/types/productJournal').ProductNote }>('product-journal', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', note_id, ...data }),
    }),
  convert: (note_id: string) =>
    api<{ feature: unknown; note: import('@/types/productJournal').ProductNote }>('product-journal', {
      method: 'POST',
      body: JSON.stringify({ action: 'convert', note_id }),
    }),
  exportMarkdown: () =>
    api<{ markdown: string }>('product-journal?action=export'),
  isFounder: () =>
    api<{ notes: import('@/types/productJournal').ProductNote[] }>('product-journal').then(() => true).catch((e: ApiError) => (e.status === 403 ? false : Promise.reject(e))),
};
