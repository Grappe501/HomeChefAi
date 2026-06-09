/**
 * KLE v7 Pillar 2 — infer household behavior & rhythm from logs, receipts, outcomes.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { MealOutcome } from '../../../../src/types/tasteLearning.js';
import type {
  BehaviorProfile,
  BudgetBand,
  CookNightRhythm,
  KitchenRhythmNudge,
  LeftoverStyle,
  ShopDayPattern,
  TimeBudget,
} from '../../../../src/types/behaviorLearning.js';
import { DAY_NAMES, DEFAULT_TIME_BUDGET } from '../../../../src/types/behaviorLearning.js';
import type { DecisionLedgerEntry } from '../ai/decisionLedger.js';

const DAY_NAMES_LIST = [...DAY_NAMES];

export interface BehaviorSourceData {
  profile: Profile;
  usageLogs: { id: string; meal_name?: string; created_at: string }[];
  receipts: { id: string; receipt_date?: string; total_amount?: number; verified?: boolean; created_at: string }[];
  mealOutcomes: MealOutcome[];
  ledgerEntries: DecisionLedgerEntry[];
}

function inferCookNights(logs: BehaviorSourceData['usageLogs']): CookNightRhythm[] {
  if (logs.length < 4) return [];
  const dayCounts = new Array(7).fill(0) as number[];
  for (const log of logs) {
    dayCounts[new Date(log.created_at).getDay()]++;
  }
  const total = dayCounts.reduce((s, c) => s + c, 0);
  const results: CookNightRhythm[] = [];
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] < 2) continue;
    const share = dayCounts[i] / total;
    if (share < 0.18) continue;
    results.push({ day: i, day_name: DAY_NAMES_LIST[i], share: Math.round(share * 100) / 100 });
  }
  return results.sort((a, b) => b.share - a.share).slice(0, 3);
}

function inferShopDay(receipts: BehaviorSourceData['receipts']): ShopDayPattern | undefined {
  const verified = receipts.filter((r) => r.verified !== false);
  if (verified.length < 2) return undefined;

  const dayCounts = new Array(7).fill(0) as number[];
  const dates: Date[] = [];
  for (const r of verified) {
    const d = new Date(r.receipt_date ?? r.created_at);
    if (Number.isNaN(d.getTime())) continue;
    dayCounts[d.getDay()]++;
    dates.push(d);
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  let bestDay = 0;
  let bestCount = 0;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > bestCount) {
      bestCount = dayCounts[i];
      bestDay = i;
    }
  }
  if (bestCount < 2) return undefined;

  let avgGap: number | undefined;
  if (dates.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / 86400000);
    }
    avgGap = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
  }

  return {
    day: bestDay,
    day_name: DAY_NAMES_LIST[bestDay],
    confidence: Math.min(0.92, 0.45 + bestCount * 0.12),
    avg_days_between: avgGap,
  };
}

function inferLeftoverStyle(logs: BehaviorSourceData['usageLogs']): { style: LeftoverStyle; share: number } {
  if (logs.length < 3) return { style: 'unknown', share: 0 };
  const leftoverLogs = logs.filter((l) => l.meal_name?.toLowerCase().includes('leftover'));
  const share = leftoverLogs.length / logs.length;
  if (share >= 0.2) return { style: 'batch_cooker', share: Math.round(share * 100) / 100 };
  if (share <= 0.05) return { style: 'cook_fresh', share: Math.round(share * 100) / 100 };
  return { style: 'mixed', share: Math.round(share * 100) / 100 };
}

function inferBudgetBand(receipts: BehaviorSourceData['receipts']): BudgetBand | undefined {
  const verified = receipts.filter((r) => r.verified !== false && Number(r.total_amount) > 0);
  if (verified.length < 2) return undefined;

  const weekTotals = new Map<string, number>();
  for (const r of verified) {
    const d = new Date(r.receipt_date ?? r.created_at);
    const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000)}`;
    weekTotals.set(weekKey, (weekTotals.get(weekKey) ?? 0) + Number(r.total_amount));
  }
  const totals = [...weekTotals.values()];
  if (!totals.length) return undefined;
  const avg = totals.reduce((s, t) => s + t, 0) / totals.length;
  const low = Math.min(...totals);
  const high = Math.max(...totals);
  return {
    weekly_low: Math.round(low),
    weekly_high: Math.round(high),
    weekly_avg: Math.round(avg),
  };
}

function inferTimeBudget(
  profile: Profile,
  outcomes: MealOutcome[],
  ledger: DecisionLedgerEntry[],
  stored?: TimeBudget,
): TimeBudget {
  let weeknight = stored?.weeknight_max_minutes ?? DEFAULT_TIME_BUDGET.weeknight_max_minutes;
  let weekendOk = stored?.weekend_project_ok ?? DEFAULT_TIME_BUDGET.weekend_project_ok;

  const tooLong = outcomes.filter((o) => o.rating === 'too_long').length;
  const tooHard = outcomes.filter((o) => o.rating === 'too_hard').length;
  if (tooLong >= 2) weeknight = Math.max(25, weeknight - 10);
  if (tooHard >= 2) weeknight = Math.max(30, weeknight - 5);

  const priorities = profile.food_priorities ?? profile.culinary_profile?.priorities ?? [];
  if (priorities.includes('meal_plan_easier') || priorities.includes('save_money')) {
    weeknight = Math.min(weeknight, 40);
  }

  const quickRejects = ledger.filter(
    (e) => e.outcome === 'replaced' && (e.metadata?.complexity === 'advanced' || e.metadata?.recommendation_type === 'weekend_project'),
  ).length;
  if (quickRejects >= 2) weeknight = Math.max(25, weeknight - 8);

  return { weeknight_max_minutes: weeknight, weekend_project_ok: weekendOk };
}

function buildRhythmNotes(params: {
  cookNights: CookNightRhythm[];
  shopDay?: ShopDayPattern;
  leftover: LeftoverStyle;
  budget?: BudgetBand;
  timeBudget: TimeBudget;
}): string[] {
  const notes: string[] = [];
  if (params.cookNights.length) {
    notes.push(`Most active cook nights: ${params.cookNights.map((c) => c.day_name).join(', ')}.`);
  }
  if (params.shopDay) {
    notes.push(`Usually shops on ${params.shopDay.day_name}s.`);
  }
  if (params.leftover === 'batch_cooker') {
    notes.push('This kitchen plans ahead — leftovers show up often in cook logs.');
  }
  if (params.budget) {
    notes.push(`Typical weekly grocery spend about $${params.budget.weekly_avg}.`);
  }
  notes.push(`Weeknight meals ideally under ${params.timeBudget.weeknight_max_minutes} minutes.`);
  return notes.slice(0, 5);
}

export function inferBehaviorProfile(data: BehaviorSourceData): BehaviorProfile {
  const stored = data.profile.behavior_profile as BehaviorProfile | undefined;
  const cook_nights = inferCookNights(data.usageLogs);
  const shop_day = inferShopDay(data.receipts);
  const { style: leftover_style, share: leftover_share } = inferLeftoverStyle(data.usageLogs);
  const budget_band = inferBudgetBand(data.receipts);
  const time_budget = inferTimeBudget(data.profile, data.mealOutcomes, data.ledgerEntries, stored?.time_budget);

  const rhythm_notes = buildRhythmNotes({
    cookNights: cook_nights,
    shopDay: shop_day,
    leftover: leftover_style,
    budget: budget_band,
    timeBudget: time_budget,
  });

  return {
    version: 1,
    cook_nights,
    shop_day,
    leftover_style,
    leftover_share,
    budget_band,
    time_budget,
    rhythm_notes,
    updated_at: new Date().toISOString(),
  };
}

export function formatBehaviorProfileForPrompt(profile: BehaviorProfile): string {
  const lines: string[] = ['Kitchen rhythm (learned):'];
  if (profile.cook_nights.length) {
    lines.push(`Cook nights: ${profile.cook_nights.map((c) => `${c.day_name} (${Math.round(c.share * 100)}%)`).join(', ')}.`);
  }
  if (profile.shop_day) {
    lines.push(`Shop day: ${profile.shop_day.day_name} (confidence ${Math.round(profile.shop_day.confidence * 100)}%).`);
  }
  if (profile.leftover_style !== 'unknown') {
    lines.push(`Leftover style: ${profile.leftover_style.replace(/_/g, ' ')}.`);
  }
  if (profile.budget_band) {
    lines.push(`Weekly grocery band: $${profile.budget_band.weekly_low}–$${profile.budget_band.weekly_high} (avg $${profile.budget_band.weekly_avg}).`);
  }
  lines.push(`Weeknight time budget: ${profile.time_budget.weeknight_max_minutes} min${profile.time_budget.weekend_project_ok ? '; weekend project cooks OK' : ''}.`);
  return lines.length > 1 ? lines.join('\n') : '';
}

export function buildRhythmNudges(profile: BehaviorProfile, now = new Date()): KitchenRhythmNudge[] {
  const nudges: KitchenRhythmNudge[] = [];
  const today = now.getDay();

  if (profile.shop_day && today === profile.shop_day.day) {
    nudges.push({
      id: 'shop_day_today',
      title: 'Usual shop day',
      message: `You often grocery shop on ${profile.shop_day.day_name}s — check your supply list.`,
      clara_prompt: 'What should I add to my supply list for this week?',
    });
  }

  const cookTonight = profile.cook_nights.find((c) => c.day === today && c.share >= 0.2);
  if (cookTonight) {
    nudges.push({
      id: 'cook_night_today',
      title: `${cookTonight.day_name} cook night`,
      message: `${cookTonight.day_name}s are one of your most active cooking days.`,
      clara_prompt: `Suggest a ${profile.time_budget.weeknight_max_minutes}-minute dinner for tonight.`,
    });
  }

  if (profile.leftover_style === 'batch_cooker') {
    nudges.push({
      id: 'batch_cook_hint',
      title: 'Batch-cook friendly',
      message: 'Your kitchen logs show you plan ahead — consider a double batch tonight.',
      clara_prompt: 'Suggest a batch-cook meal that makes great leftovers.',
    });
  }

  return nudges.slice(0, 2);
}
