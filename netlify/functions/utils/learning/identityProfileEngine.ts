/**
 * KLE v7 Pillar 4 — infer unified household identity from graph, KLE pillars, profile.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { BehaviorProfile } from '../../../../src/types/behaviorLearning.js';
import type { SkillProfile } from '../../../../src/types/skillLearning.js';
import type { TasteProfile } from '../../../../src/types/tasteLearning.js';
import type { DecisionLedgerEntry } from '../ai/decisionLedger.js';
import type { HouseholdGraphEdge } from '../../../../src/types/householdGraph.js';
import type { DetectedPattern } from '../../../../src/types/householdGraph.js';
import type { IdentityNudge, IdentityProfile } from '../../../../src/types/identityLearning.js';
import { inferHouseholdIdentity } from '../brain/householdIdentity.js';

export interface IdentitySourceData {
  profile: Profile;
  graphEdges: HouseholdGraphEdge[];
  patterns: DetectedPattern[];
  ledgerEntries: DecisionLedgerEntry[];
  tasteProfile?: TasteProfile;
  behaviorProfile?: BehaviorProfile;
  skillProfile?: SkillProfile;
}

function tasteSignals(taste?: TasteProfile): string[] {
  if (!taste?.taste_vector) return [];
  const v = taste.taste_vector;
  const signals: string[] = [];
  if (v.spicy > 0.62) signals.push('spicy-forward');
  if (v.spicy < 0.38) signals.push('mild');
  if (v.comfort > 0.62) signals.push('comfort-food');
  if (v.fresh_light > 0.62) signals.push('fresh & light');
  if (v.adventurous > 0.62) signals.push('adventurous eater');
  if (v.kid_friendly > 0.62) signals.push('kid-friendly');
  if (v.quick_weeknight > 0.62) signals.push('quick weeknight');
  return signals.slice(0, 4);
}

function rhythmSignals(behavior?: BehaviorProfile): string[] {
  if (!behavior) return [];
  const signals: string[] = [];
  if (behavior.leftover_style === 'batch_cooker') signals.push('batch-cook friendly');
  if (behavior.shop_day) signals.push(`shops ${behavior.shop_day.day_name}s`);
  if (behavior.cook_nights.length) {
    signals.push(`cooks ${behavior.cook_nights.slice(0, 2).map((c) => c.day_name).join(' & ')}`);
  }
  if (behavior.budget_band) signals.push('budget-conscious');
  return signals.slice(0, 4);
}

function buildArchetypeLabel(params: {
  primary: string;
  secondary?: string;
  traits: string[];
  cooksWith: string[];
}): string {
  const parts: string[] = [params.primary];
  if (params.secondary && !params.primary.toLowerCase().includes(params.secondary.toLowerCase())) {
    parts.push(params.secondary);
  }
  const trait = params.traits.find((t) => /batch|family|kid|quick|comfort|adventurous/i.test(t));
  if (trait) parts.push(trait.replace(/-/g, ' '));
  if (params.cooksWith.includes('kids')) parts.push('family kitchen');
  else if (params.cooksWith.includes('solo')) parts.push('solo cook');
  return parts.slice(0, 3).join(' · ');
}

function buildIdentityNotes(params: {
  archetype: string;
  taste: string[];
  rhythm: string[];
  skill: string;
  priorities: string[];
}): string[] {
  const notes: string[] = [`This kitchen reads as: ${params.archetype}.`];
  if (params.taste.length) notes.push(`Taste lean: ${params.taste.join(', ')}.`);
  if (params.rhythm.length) notes.push(`Rhythm: ${params.rhythm.join(', ')}.`);
  if (params.priorities.length) notes.push(`Priorities: ${params.priorities.slice(0, 3).join(', ')}.`);
  notes.push(`Skill confidence: ${params.skill}.`);
  return notes.slice(0, 5);
}

export function inferIdentityProfile(data: IdentitySourceData): IdentityProfile {
  const ledgerKeptCount = data.ledgerEntries.filter((e) => e.outcome === 'accepted').length;
  const base = inferHouseholdIdentity({
    cuisinePreferences: data.profile.cuisine_preferences ?? [],
    graphEdges: data.graphEdges,
    patterns: data.patterns,
    ledgerKeptCount,
  });

  const taste_signals = tasteSignals(data.tasteProfile);
  const rhythm_signals = rhythmSignals(data.behaviorProfile);
  const skill_level = data.skillProfile?.overall_confidence ?? data.profile.culinary_profile?.confidence ?? 'beginner';

  const cooks_with = data.profile.culinary_profile?.cooks_with?.map(String) ?? [];
  const food_priorities = [
    ...(data.profile.food_priorities ?? []),
    ...(data.profile.culinary_profile?.priorities ?? []),
  ].slice(0, 6);

  const identity_traits = [
    ...taste_signals,
    ...rhythm_signals,
    ...base.kitchen_identity.cooking_styles?.slice(0, 2).map((s) => s.toLowerCase()) ?? [],
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);

  const archetype_label = buildArchetypeLabel({
    primary: base.inferred_cooking_style.primary_label,
    secondary: base.inferred_cooking_style.secondary_label,
    traits: identity_traits,
    cooksWith: cooks_with,
  });

  const identity_notes = buildIdentityNotes({
    archetype: archetype_label,
    taste: taste_signals,
    rhythm: rhythm_signals,
    skill: skill_level,
    priorities: food_priorities,
  });

  return {
    version: 1,
    kitchen_name: data.profile.household_display_name,
    primary_style: base.inferred_cooking_style.primary_label,
    secondary_style: base.inferred_cooking_style.secondary_label,
    archetype_label,
    cuisine_tags: base.inferred_cooking_style.cuisine_tags,
    identity_traits,
    cooks_with,
    food_priorities,
    taste_signals,
    rhythm_signals,
    skill_level,
    confidence: base.inferred_cooking_style.confidence,
    identity_notes,
    updated_at: new Date().toISOString(),
  };
}

export function formatIdentityProfileForPrompt(profile: IdentityProfile): string {
  if (!profile.primary_style && !profile.identity_traits.length) return '';
  const lines: string[] = ['Household kitchen identity (learned):'];
  if (profile.kitchen_name) lines.push(`Kitchen: ${profile.kitchen_name}.`);
  lines.push(`Style: ${profile.archetype_label}.`);
  if (profile.cooks_with.length) {
    lines.push(`Cooks with: ${profile.cooks_with.join(', ')}.`);
  }
  if (profile.taste_signals.length) {
    lines.push(`Taste identity: ${profile.taste_signals.join(', ')}.`);
  }
  if (profile.rhythm_signals.length) {
    lines.push(`Rhythm identity: ${profile.rhythm_signals.join(', ')}.`);
  }
  if (profile.food_priorities.length) {
    lines.push(`Priorities: ${profile.food_priorities.slice(0, 4).join(', ')}.`);
  }
  lines.push(`Skill level: ${profile.skill_level}.`);
  return lines.length > 1 ? lines.join('\n') : '';
}

export function buildIdentityNudges(profile: IdentityProfile): IdentityNudge[] {
  const nudges: IdentityNudge[] = [];

  nudges.push({
    id: 'identity_style',
    title: profile.archetype_label,
    message: profile.identity_notes?.[0] ?? `Your kitchen leans ${profile.primary_style.toLowerCase()}.`,
    clara_prompt: `Suggest a dinner that fits our ${profile.primary_style.toLowerCase()} kitchen style.`,
  });

  if (profile.taste_signals.includes('adventurous eater')) {
    nudges.push({
      id: 'adventure_nudge',
      title: 'Try something new',
      message: 'Your taste profile shows curiosity — stretch your style this week.',
      clara_prompt: 'Suggest an adventurous dinner that still fits our kitchen identity.',
    });
  } else if (profile.rhythm_signals.includes('batch-cook friendly')) {
    nudges.push({
      id: 'batch_identity',
      title: 'Batch-cook kitchen',
      message: 'Your identity is plan-ahead — double a recipe this week.',
      clara_prompt: 'Suggest a batch-cook meal that matches our kitchen style.',
    });
  } else if (profile.cooks_with.includes('kids')) {
    nudges.push({
      id: 'family_kitchen',
      title: 'Family kitchen',
      message: 'Plan something the whole household will enjoy.',
      clara_prompt: 'Suggest a kid-friendly family dinner in our usual style.',
    });
  }

  return nudges.slice(0, 2);
}

export function identityGraphPayload(profile: IdentityProfile, data: IdentitySourceData) {
  const ledgerKeptCount = data.ledgerEntries.filter((e) => e.outcome === 'accepted').length;
  return inferHouseholdIdentity({
    cuisinePreferences: data.profile.cuisine_preferences ?? [],
    graphEdges: data.graphEdges,
    patterns: data.patterns,
    ledgerKeptCount,
  });
}
