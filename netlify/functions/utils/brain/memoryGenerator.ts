import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeCountConfidence, computeCycleConfidence, meetsThreshold } from './confidence.js';
import { generateSkillObservedMemories } from './skillMemories.js';
import {
  type BrainContext,
  type GeneratedMemory,
  DAY_NAMES,
  daysBetween,
  itemMatchesStaple,
  itemMatchesWasteTrack,
  normalizeKey,
} from './types.js';

function loadArchetypes(): Record<string, { label: string; keywords: string[] }> {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const file = path.join(dir, '../../data/archetypes.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    const file = path.join(process.cwd(), 'netlify/functions/data/archetypes.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
}

export function generateMemories(ctx: BrainContext): GeneratedMemory[] {
  const memories: GeneratedMemory[] = [];
  memories.push(...generateConsumptionMemories(ctx));
  memories.push(...generateMealHabitMemories(ctx));
  memories.push(...generateWasteMemories(ctx));
  memories.push(...generatePreferenceMemories(ctx));
  memories.push(...generateCookingDayMemories(ctx));
  memories.push(...generateShoppingMemories(ctx));
  memories.push(...generateSkillObservedMemories(ctx));
  return memories;
}

function generateConsumptionMemories(ctx: BrainContext): GeneratedMemory[] {
  const purchases = new Map<string, { name: string; dates: Date[]; receiptIds: string[] }>();

  for (const receipt of ctx.receipts.filter((r) => r.verified)) {
    const receiptDate = new Date(receipt.receipt_date || receipt.created_at);
    for (const item of receipt.items) {
      const key = normalizeKey(item.name);
      if (!key) continue;
      if (!itemMatchesStaple(item.name) && !purchases.has(key)) {
        const existing = countItemInReceipts(ctx.receipts, key);
        if (existing < 3) continue;
      }
      const entry = purchases.get(key) || { name: item.name, dates: [], receiptIds: [] };
      entry.dates.push(receiptDate);
      entry.receiptIds.push(receipt.id);
      purchases.set(key, entry);
    }
  }

  const results: GeneratedMemory[] = [];
  for (const [key, data] of purchases) {
    if (data.dates.length < 3) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    const gaps: number[] = [];
    for (let i = 1; i < data.dates.length; i++) {
      gaps.push(daysBetween(data.dates[i], data.dates[i - 1]));
    }
    const avgCycle = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + Math.pow(g - avgCycle, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const stdDevRatio = avgCycle > 0 ? stdDev / avgCycle : 1;
    const historyDays = daysBetween(data.dates[data.dates.length - 1], data.dates[0]);
    const confidence = computeCycleConfidence(data.dates.length, historyDays, stdDevRatio);
    const surfaced = meetsThreshold('consumption', data.dates.length, confidence);
    const roundedDays = Math.round(avgCycle);

    const daysSinceLast = daysBetween(new Date(), data.dates[data.dates.length - 1]);
    const runningLow = daysSinceLast >= avgCycle * 0.75;

    let insight = `Chef, you appear to buy ${data.name.toLowerCase()} about every ${roundedDays} days.`;
    let action_prompt: string | undefined;
    if (runningLow && surfaced) {
      const daysUntil = Math.max(1, Math.round(avgCycle - daysSinceLast));
      action_prompt = `Chef, you're probably running low on ${data.name.toLowerCase()}. Based on your normal usage, I'd expect you'll need more in the next ${daysUntil === 1 ? 'day' : `${daysUntil} days`}.`;
    }

    results.push({
      memory_type: 'consumption',
      subject_key: key,
      headline: `${data.name} — every ~${roundedDays} days`,
      insight,
      action_prompt,
      confidence,
      surfaced,
      metadata: {
        source_events: data.receiptIds.map((id) => `receipt:${id}`),
        observation_count: data.dates.length,
        history_days: Math.round(historyDays),
        computed_value: Math.round(avgCycle * 10) / 10,
        computed_label: 'Average cycle (days)',
        confidence,
        formula: 'consumption_cycle_v1',
        evidence_lines: [
          `${data.dates.length} ${data.name.toLowerCase()} purchases`,
          `${Math.round(historyDays)} days of history`,
          `Average cycle: ${(Math.round(avgCycle * 10) / 10).toFixed(1)} days`,
          `Confidence: ${Math.round(confidence * 100)}%`,
        ],
        date_range_start: data.dates[0].toISOString(),
        date_range_end: data.dates[data.dates.length - 1].toISOString(),
      },
    });
  }
  return results;
}

function countItemInReceipts(receipts: BrainContext['receipts'], key: string): number {
  let count = 0;
  for (const r of receipts.filter((x) => x.verified)) {
    if (r.items.some((i) => normalizeKey(i.name) === key)) count++;
  }
  return count;
}

function generateMealHabitMemories(ctx: BrainContext): GeneratedMemory[] {
  const mealCounts = new Map<string, { label: string; count: number; logIds: string[]; dates: Date[] }>();
  for (const log of ctx.usageLogs) {
    if (!log.meal_name?.trim()) continue;
    const key = normalizeKey(log.meal_name);
    const entry = mealCounts.get(key) || { label: log.meal_name, count: 0, logIds: [], dates: [] };
    entry.count++;
    entry.logIds.push(log.id);
    entry.dates.push(new Date(log.created_at));
    mealCounts.set(key, entry);
  }

  const results: GeneratedMemory[] = [];
  for (const [key, data] of mealCounts) {
    if (data.count < 3) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    const historyDays = Math.max(1, daysBetween(data.dates[data.dates.length - 1], data.dates[0]));
    const confidence = computeCountConfidence(data.count, THRESHOLD_MIN('habit_meal'), historyDays);
    const surfaced = meetsThreshold('habit_meal', data.count, confidence);

    results.push({
      memory_type: 'habit',
      subject_key: `meal_${key}`,
      headline: `${data.label} — household favorite`,
      insight: `Chef, ${data.label.toLowerCase()} ${data.count >= 4 ? 'appears to be one of your household favorites' : 'shows up often in your cooking'}.`,
      confidence,
      surfaced,
      metadata: buildEvidence(data.logIds, data.count, historyDays, confidence, 'meal_habit_v1', [
        `${data.count} times cooked`,
        `${Math.round(historyDays)} days of history`,
      ]),
    });
  }
  return results;
}

function generateWasteMemories(ctx: BrainContext): GeneratedMemory[] {
  const wasteCounts = new Map<string, { name: string; count: number; eventIds: string[]; dates: Date[] }>();
  for (const event of ctx.wasteEvents) {
    if (!itemMatchesWasteTrack(event.item_name)) continue;
    const key = event.item_key;
    const entry = wasteCounts.get(key) || { name: event.item_name, count: 0, eventIds: [], dates: [] };
    entry.count++;
    entry.eventIds.push(event.id);
    entry.dates.push(new Date(event.created_at));
    wasteCounts.set(key, entry);
  }

  const results: GeneratedMemory[] = [];
  for (const [key, data] of wasteCounts) {
    if (data.count < 2) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    const historyDays = Math.max(1, daysBetween(data.dates[data.dates.length - 1], data.dates[0]));
    const confidence = computeCountConfidence(data.count, THRESHOLD_MIN('waste'), historyDays);
    const surfaced = meetsThreshold('waste', data.count, confidence);

    results.push({
      memory_type: 'waste',
      subject_key: key,
      headline: `${data.name} — frequently discarded`,
      insight: `Chef, ${data.name.toLowerCase()} has been discarded ${data.count} times recently.`,
      action_prompt: `Chef, would you like me to prioritize meals that use ${data.name.toLowerCase()} earlier in the week?`,
      confidence,
      surfaced,
      metadata: buildEvidence(
        data.eventIds.map((id) => `waste:${id}`),
        data.count,
        historyDays,
        confidence,
        'waste_pattern_v1',
        [`${data.count} discard events`, `Last ${Math.round(historyDays)} days`]
      ),
    });
  }
  return results;
}

function generatePreferenceMemories(ctx: BrainContext): GeneratedMemory[] {
  const cuisineHits = new Map<string, { label: string; count: number; logIds: string[]; dates: Date[] }>();

  for (const log of ctx.usageLogs) {
    const text = (log.meal_name || '').toLowerCase();
    if (!text) continue;
    for (const [id, archetype] of Object.entries(loadArchetypes())) {
      if (archetype.keywords.some((kw) => text.includes(kw))) {
        const entry = cuisineHits.get(id) || { label: archetype.label, count: 0, logIds: [], dates: [] };
        entry.count++;
        entry.logIds.push(log.id);
        entry.dates.push(new Date(log.created_at));
        cuisineHits.set(id, entry);
      }
    }
  }

  const results: GeneratedMemory[] = [];
  const sorted = [...cuisineHits.entries()].sort((a, b) => b[1].count - a[1].count);

  for (const [key, data] of sorted) {
    if (data.count < 3) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    const historyDays = Math.max(1, daysBetween(data.dates[data.dates.length - 1], data.dates[0]));
    const confidence = computeCountConfidence(data.count, THRESHOLD_MIN('preference'), historyDays);
    const surfaced = meetsThreshold('preference', data.count, confidence);
    const monthApprox = Math.max(1, Math.round(historyDays / 30));

    results.push({
      memory_type: 'preference',
      subject_key: `cuisine_${key}`,
      headline: `${data.label} cuisine preference`,
      insight:
        data.count >= 5
          ? `Chef, you've cooked ${data.label} meals ${data.count} times in the last ${monthApprox} month${monthApprox > 1 ? 's' : ''} — more than most other cuisines in your kitchen.`
          : `Chef, your household strongly prefers ${data.label} meals.`,
      confidence,
      surfaced,
      metadata: buildEvidence(data.logIds, data.count, historyDays, confidence, 'cuisine_preference_v1', [
        `${data.count} ${data.label} meals logged`,
        `${Math.round(historyDays)} days of history`,
      ]),
    });
  }
  return results.slice(0, 3);
}

function generateCookingDayMemories(ctx: BrainContext): GeneratedMemory[] {
  if (ctx.usageLogs.length < 5) return [];

  const dayCounts = new Array(7).fill(0) as number[];
  const logIdsByDay = new Map<number, string[]>();

  for (const log of ctx.usageLogs) {
    const d = new Date(log.created_at).getDay();
    dayCounts[d]++;
    const ids = logIdsByDay.get(d) || [];
    ids.push(log.id);
    logIdsByDay.set(d, ids);
  }

  const total = dayCounts.reduce((s, c) => s + c, 0);
  const results: GeneratedMemory[] = [];

  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] < 2) continue;
    const share = dayCounts[i] / total;
    const confidence = computeCountConfidence(dayCounts[i], 2, 30) * (share > 0.25 ? 1.05 : 0.95);
    const capped = Math.min(0.95, Math.round(confidence * 100) / 100);
    if (!meetsThreshold('habit_day', ctx.usageLogs.length, capped)) continue;

    const dayName = DAY_NAMES[i];
    results.push({
      memory_type: 'habit',
      subject_key: `day_${dayName.toLowerCase()}`,
      headline: `${dayName}s — primary cooking day`,
      insight: `Chef, ${dayName} appears to be one of your primary cooking days.`,
      confidence: capped,
      surfaced: true,
      metadata: buildEvidence(logIdsByDay.get(i) || [], dayCounts[i], 30, capped, 'cooking_day_v1', [
        `${dayCounts[i]} meals on ${dayName}s`,
        `${ctx.usageLogs.length} total cook logs`,
        `${Math.round(share * 100)}% of your cooking`,
      ]),
    });
  }
  return results.slice(0, 2);
}

function generateShoppingMemories(ctx: BrainContext): GeneratedMemory[] {
  const storeCounts = new Map<string, { label: string; count: number; receiptIds: string[]; dates: Date[] }>();

  for (const receipt of ctx.receipts.filter((r) => r.verified && r.store_name)) {
    const key = normalizeKey(receipt.store_name!);
    const entry = storeCounts.get(key) || { label: receipt.store_name!, count: 0, receiptIds: [], dates: [] };
    entry.count++;
    entry.receiptIds.push(receipt.id);
    entry.dates.push(new Date(receipt.receipt_date || receipt.created_at));
    storeCounts.set(key, entry);
  }

  const results: GeneratedMemory[] = [];
  for (const [key, data] of storeCounts) {
    if (data.count < 3) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    const historyDays = Math.max(1, daysBetween(data.dates[data.dates.length - 1], data.dates[0]));
    const confidence = computeCountConfidence(data.count, THRESHOLD_MIN('shopping'), historyDays);
    const surfaced = meetsThreshold('shopping', data.count, confidence);

    results.push({
      memory_type: 'shopping',
      subject_key: key,
      headline: `Shops at ${data.label}`,
      insight: `Chef, you typically shop at ${data.label}.`,
      confidence,
      surfaced,
      metadata: buildEvidence(
        data.receiptIds.map((id) => `receipt:${id}`),
        data.count,
        historyDays,
        confidence,
        'shopping_pattern_v1',
        [`${data.count} receipts from ${data.label}`, `${Math.round(historyDays)} days of history`]
      ),
    });
  }
  return results.slice(0, 2);
}

function THRESHOLD_MIN(type: 'habit_meal' | 'waste' | 'preference' | 'shopping'): number {
  const map = { habit_meal: 3, waste: 2, preference: 3, shopping: 3 };
  return map[type];
}

function buildEvidence(
  sourceEvents: string[],
  count: number,
  historyDays: number,
  confidence: number,
  formula: string,
  extraLines: string[]
) {
  return {
    source_events: sourceEvents,
    observation_count: count,
    history_days: Math.round(historyDays),
    confidence,
    formula,
    evidence_lines: [...extraLines, `Confidence: ${Math.round(confidence * 100)}%`],
  };
}
