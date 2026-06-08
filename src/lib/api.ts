const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions';

function getUserId(): string | null {
  return localStorage.getItem('homechef_user_id');
}

async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(`${API_BASE}/${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const authApi = {
  login: (data: { email?: string; name?: string; user_id?: string }) =>
    api<{ user: { id: string; email?: string; name?: string }; profile: Record<string, unknown> }>('auth', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const profileApi = {
  get: () => api<{ user: unknown; profile: Record<string, unknown> }>('profile'),
  update: (data: Record<string, unknown>) =>
    api<{ profile: Record<string, unknown> }>('profile', { method: 'PUT', body: JSON.stringify(data) }),
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

export const receiptsApi = {
  list: () => api<{ receipts: import('@/types').Receipt[] }>('receipts'),
  scan: (image: string) =>
    api<{ receipt: import('@/types').Receipt; parsed: import('@/types').ReceiptParseResult }>('receipts', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
  verify: (receipt_id: string) =>
    api<{ receipt: import('@/types').Receipt; items_added: number }>('receipts', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify', receipt_id }),
    }),
};

export const mealsApi = {
  list: () => api<{ plans: import('@/types').MealPlan[] }>('meals'),
  plan: (data: Record<string, unknown>) =>
    api<{ plan: import('@/types').MealPlan }>('meals', { method: 'POST', body: JSON.stringify(data) }),
  whatCanIMake: () =>
    api<{ suggestions: import('@/types').MealPlanData }>('meals', {
      method: 'POST',
      body: JSON.stringify({ action: 'what-can-i-make' }),
    }),
};

export const usageApi = {
  log: (data: { description?: string; meal_name?: string; items_used: { name: string; quantity: number; unit: string; item_id?: string }[] }) =>
    api<{ log: unknown; inventory_updated?: boolean }>('usage', { method: 'POST', body: JSON.stringify(data) }),
  list: () => api<{ logs: import('@/types').UsageLog[] }>('usage'),
};

export const assistantApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api<{ reply: string; suggested_items?: { name: string; quantity: number; unit: string }[]; action?: string }>('assistant', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};

export function setUserId(id: string) {
  localStorage.setItem('homechef_user_id', id);
}

export function clearUserId() {
  localStorage.removeItem('homechef_user_id');
}

export function getStoredUserId() {
  return getUserId();
}
