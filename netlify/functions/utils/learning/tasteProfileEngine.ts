/**
 * KLE v7 Pillar 1 — infer taste vector from ledger, outcomes, profile, cook history.
 */

import type { Profile } from '../../../../src/types/index.js';
import type {
  MealOutcome,
  MealOutcomeRating,
  TastePreferenceEntry,
  TasteProfile,
  TasteVector,
} from '../../../../src/types/tasteLearning.js';
import { DEFAULT_TASTE_VECTOR } from '../../../../src/types/tasteLearning.js';
import type { DecisionLedgerEntry } from '../ai/decisionLedger.js';
import { processLedgerOutcomes } from '../ai/outcomeProcessor.js';

const SPICY_HINTS = /\b(spicy|hot|chili|jalape|sriracha|cajun|thai|indian|curry)\b/i;
const RICH_HINTS = /\b(cream|butter|cheese|bacon|rich|comfort|mac and cheese|carbonara)\b/i;
const FRESH_HINTS = /\b(salad|grilled|light|fresh|steamed|veggie|bowl)\b/i;
const ADVENTURE_HINTS = /\b(exotic|fusion|new|unusual|ethnic|explore)\b/i;
const KID_HINTS = /\b(kid|family|simple|mild|pasta|nugget|pizza|mac)\b/i;
const QUICK_HINTS = /\b(quick|easy|15|20|30 min|weeknight|fast)\b/i;

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function bump(vec: TasteVector, key: keyof TasteVector, delta: number): void {
  vec[key] = clamp(vec[key] + delta);
}

function textSignals(text: string, vec: TasteVector, weight: number): void {
  if (SPICY_HINTS.test(text)) bump(vec, 'spicy', weight);
  if (RICH_HINTS.test(text)) bump(vec, 'rich', weight);
  if (FRESH_HINTS.test(text)) bump(vec, 'fresh_light', weight);
  if (ADVENTURE_HINTS.test(text)) bump(vec, 'adventurous', weight);
  if (KID_HINTS.test(text)) bump(vec, 'kid_friendly', weight);
  if (QUICK_HINTS.test(text)) bump(vec, 'quick_weeknight', weight);
  if (/\b(comfort|hearty|soup|stew|casserole)\b/i.test(text)) bump(vec, 'comfort', weight);
  if (/\b(citrus|lemon|lime|vinegar|pickle|tangy)\b/i.test(text)) bump(vec, 'acidic', weight);
}

function outcomeAdjust(rating: MealOutcomeRating, vec: TasteVector): void {
  const boost = rating === 'loved' ? 0.04 : rating === 'ok' ? 0.01 : rating === 'never_again' ? -0.06 : -0.03;
  if (rating === 'too_hard') bump(vec, 'adventurous', -0.05);
  if (rating === 'too_long') bump(vec, 'quick_weeknight', 0.06);
  if (rating === 'loved') bump(vec, 'comfort', boost);
  if (rating === 'never_again') bump(vec, 'comfort', boost);
}

function cuisineSeed(cuisines: string[], vec: TasteVector): void {
  for (const c of cuisines) {
    const lower = c.toLowerCase();
    if (/thai|indian|mexican|korean|sichuan/.test(lower)) bump(vec, 'spicy', 0.08);
    if (/italian|french|southern|comfort/.test(lower)) bump(vec, 'rich', 0.06);
    if (/japanese|mediterranean|vietnamese/.test(lower)) bump(vec, 'fresh_light', 0.06);
    if (/ethiopian|moroccan|fusion/.test(lower)) bump(vec, 'adventurous', 0.08);
  }
}

function prioritySeed(profile: Profile, vec: TasteVector): void {
  const priorities = profile.food_priorities ?? profile.culinary_profile?.priorities ?? [];
  for (const p of priorities) {
    if (p === 'feed_family') bump(vec, 'kid_friendly', 0.1);
    if (p === 'meal_plan_easier') bump(vec, 'quick_weeknight', 0.1);
    if (p === 'learn_to_cook') bump(vec, 'adventurous', 0.05);
    if (p === 'save_money') bump(vec, 'comfort', 0.04);
  }
  const adventure = profile.culinary_profile?.adventure;
  if (adventure === 'always_curious') bump(vec, 'adventurous', 0.12);
  if (adventure === 'comfort_zone') bump(vec, 'comfort', 0.1);
}

function detectDrift(
  usageMeals: { name: string; at: string }[],
  cuisines: string[],
): string[] {
  const notes: string[] = [];
  if (!cuisines.length || usageMeals.length < 3) return notes;

  const recent = usageMeals.slice(0, 8).map((m) => m.name.toLowerCase()).join(' ');
  for (const cuisine of cuisines.slice(0, 3)) {
    const key = cuisine.toLowerCase();
    if (!recent.includes(key.split(' ')[0]) && usageMeals.length >= 6) {
      notes.push(`You listed ${cuisine} as a favorite but haven't cooked it recently.`);
    }
  }
  return notes.slice(0, 2);
}

export function inferTasteProfile(params: {
  profile: Profile;
  preferences: TastePreferenceEntry[];
  mealOutcomes: MealOutcome[];
  ledgerEntries: DecisionLedgerEntry[];
  recentMeals: { name: string; at: string }[];
}): TasteProfile {
  const vec: TasteVector = { ...DEFAULT_TASTE_VECTOR };

  cuisineSeed(params.profile.cuisine_preferences ?? [], vec);
  prioritySeed(params.profile, vec);

  const mealOutcomes = processLedgerOutcomes(params.ledgerEntries, 'meal_plan');
  for (const meal of mealOutcomes.kept_meals) textSignals(meal, vec, 0.03);
  for (const meal of mealOutcomes.replaced_meals) textSignals(meal, vec, -0.04);

  for (const outcome of params.mealOutcomes) {
    textSignals(outcome.meal_name, vec, outcome.rating === 'loved' ? 0.05 : outcome.rating === 'never_again' ? -0.05 : 0);
    outcomeAdjust(outcome.rating, vec);
  }

  for (const pref of params.preferences) {
    if (pref.kind === 'prefer') textSignals(pref.subject, vec, 0.06);
    if (pref.kind === 'avoid' || pref.kind === 'allergy') textSignals(pref.subject, vec, -0.04);
  }

  for (const meal of params.recentMeals.slice(0, 12)) {
    textSignals(meal.name, vec, 0.02);
  }

  const drift_notes = detectDrift(params.recentMeals, params.profile.cuisine_preferences ?? []);

  return {
    version: 1,
    taste_vector: vec,
    preferences: params.preferences,
    drift_notes: drift_notes.length ? drift_notes : undefined,
    updated_at: new Date().toISOString(),
  };
}

export function formatTasteProfileForPrompt(profile: TasteProfile): string {
  const v = profile.taste_vector;
  const axes: string[] = [];
  if (v.spicy > 0.62) axes.push('spicy-forward');
  if (v.spicy < 0.38) axes.push('mild');
  if (v.rich > 0.62) axes.push('rich/hearty');
  if (v.fresh_light > 0.62) axes.push('fresh & light');
  if (v.adventurous > 0.62) axes.push('adventurous');
  if (v.adventurous < 0.38) axes.push('stick to familiar');
  if (v.kid_friendly > 0.62) axes.push('kid-friendly');
  if (v.quick_weeknight > 0.62) axes.push('quick weeknights');
  if (v.comfort > 0.62) axes.push('comfort food');

  const avoids = profile.preferences.filter((p) => p.kind === 'avoid' || p.kind === 'allergy').slice(0, 8);
  const prefers = profile.preferences.filter((p) => p.kind === 'prefer').slice(0, 6);

  const lines: string[] = ['Taste profile (learned):'];
  if (axes.length) lines.push(`Style: ${axes.join(', ')}.`);
  if (prefers.length) lines.push(`Prefers: ${prefers.map((p) => p.subject).join(', ')}.`);
  if (avoids.length) lines.push(`Avoid: ${avoids.map((p) => p.subject).join(', ')}.`);
  if (profile.drift_notes?.length) lines.push(profile.drift_notes.join(' '));

  return lines.length > 1 ? lines.join('\n') : '';
}

export function topTasteLabels(profile: TasteProfile, limit = 4): string[] {
  const entries = Object.entries(profile.taste_vector) as [keyof TasteVector, number][];
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k.replace(/_/g, ' '));
}
