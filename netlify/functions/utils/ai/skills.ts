/**
 * Skill Development Engine — micro-lessons by technique + skill level (Phase 7).
 */

import type { ConfidenceLevel } from '../../../../src/types/platform.js';
import { getKnowledgeNode, listKnowledgeNodes, searchKnowledge } from './knowledgeLoader.js';

export interface TechniqueCoachTip {
  technique_id: string;
  technique_name: string;
  micro_lesson: string;
  skill_level: ConfidenceLevel;
  evidence: string[];
}

export interface SkillCoachingResult {
  tips: TechniqueCoachTip[];
  inferred_technique_ids: string[];
}

const TECHNIQUE_SIGNALS: { id: string; keywords: string[] }[] = [
  { id: 'technique.saute', keywords: ['saute', 'sauté', 'onion', 'onions', 'garlic', 'mirepoix', 'sofrito'] },
  { id: 'technique.stir_fry', keywords: ['stir fry', 'stir-fry', 'wok', 'fried rice'] },
  { id: 'technique.sear', keywords: ['sear', 'seared', 'steak', 'chicken breast', 'pork chop'] },
  { id: 'technique.roux', keywords: ['roux', 'gumbo', 'étouffée', 'etouffee', 'gravy', 'béchamel'] },
  { id: 'technique.roast', keywords: ['roast', 'roasted', 'sheet pan', 'oven'] },
  { id: 'technique.braise', keywords: ['braise', 'braised', 'pot roast', 'short rib'] },
  { id: 'technique.simmer', keywords: ['simmer', 'soup', 'stew', 'chili'] },
  { id: 'technique.poach', keywords: ['poach', 'poached', 'eggs benedict'] },
  { id: 'technique.steam', keywords: ['steam', 'steamed', 'dumpling'] },
  { id: 'technique.grill', keywords: ['grill', 'grilled', 'bbq', 'barbecue'] },
  { id: 'technique.emulsion', keywords: ['emulsion', 'mayo', 'hollandaise', 'vinaigrette'] },
  { id: 'technique.caramelize', keywords: ['caramelize', 'caramelized', 'brûlée'] },
  { id: 'technique.deglaze', keywords: ['deglaze', 'pan sauce'] },
  { id: 'technique.marinate', keywords: ['marinate', 'marinade'] },
  { id: 'technique.knead', keywords: ['knead', 'bread', 'dough', 'pizza dough'] },
  { id: 'technique.reduce', keywords: ['reduce', 'reduction', 'pan sauce'] },
  { id: 'technique.deep_fry', keywords: ['deep fry', 'deep-fry', 'fried chicken', 'tempura'] },
  { id: 'technique.smoke', keywords: ['smoke', 'smoked', 'smoker', 'brisket'] },
  { id: 'technique.broil', keywords: ['broil', 'broiled'] },
  { id: 'technique.char', keywords: ['char', 'blister', 'blistered', 'torch'] },
  { id: 'technique.pickle', keywords: ['pickle', 'pickled', 'quick pickle'] },
  { id: 'technique.brine', keywords: ['brine', 'brined', 'turkey brine'] },
  { id: 'technique.ferment', keywords: ['ferment', 'fermented', 'kimchi', 'sauerkraut'] },
  { id: 'technique.bloom_spices', keywords: ['bloom spice', 'temper spice', 'tadka', 'curry paste'] },
  { id: 'technique.layer_season', keywords: ['season', 'seasoning', 'salt layer', 'taste and adjust'] },
  { id: 'technique.stock', keywords: ['stock', 'broth', 'bone broth'] },
  { id: 'technique.glaze', keywords: ['glaze', 'glazed', 'teriyaki'] },
  { id: 'technique.rest', keywords: ['rest meat', 'resting', 'tent foil'] },
  { id: 'technique.spatchcock', keywords: ['spatchcock', 'butterfly chicken'] },
  { id: 'technique.pressure_cook', keywords: ['pressure cook', 'instant pot', 'instapot'] },
  { id: 'technique.blanch_shock', keywords: ['blanch', 'shock', 'ice bath'] },
  { id: 'technique.render_fat', keywords: ['render', 'bacon fat', 'schmaltz'] },
];

function skillLevelPrefix(level: ConfidenceLevel): string {
  switch (level) {
    case 'beginner':
      return '';
    case 'intermediate':
      return 'Level up: ';
    case 'advanced':
    case 'expert':
      return 'Pro tip: ';
    default:
      return '';
  }
}

export function inferTechniquesFromText(text: string, ingredientNames: string[] = []): string[] {
  const blob = `${text} ${ingredientNames.join(' ')}`.toLowerCase();
  const hits: string[] = [];

  for (const sig of TECHNIQUE_SIGNALS) {
    if (sig.keywords.some((kw) => blob.includes(kw))) hits.push(sig.id);
  }

  if (!hits.length) {
    const search = searchKnowledge(text.split(' ')[0] ?? text, 'technique', 2);
    for (const r of search) {
      hits.push(r.id);
    }
  }

  return [...new Set(hits)].slice(0, 4);
}

export function getMicroLesson(techniqueId: string, skillLevel: ConfidenceLevel = 'beginner'): TechniqueCoachTip | null {
  const node = getKnowledgeNode(techniqueId);
  if (!node || node.type !== 'technique') return null;

  const raw = (node.attributes?.micro_lesson as string | undefined)
    ?? node.description
    ?? `Practice ${node.display_name} — consistency builds confidence.`;

  return {
    technique_id: node.id,
    technique_name: node.display_name,
    micro_lesson: `${skillLevelPrefix(skillLevel)}${raw}`,
    skill_level: skillLevel,
    evidence: [node.id],
  };
}

export function buildSkillCoaching(
  mealText: string,
  ingredientNames: string[] = [],
  skillLevel: ConfidenceLevel = 'beginner',
): SkillCoachingResult {
  const inferred = inferTechniquesFromText(mealText, ingredientNames);
  const tips = inferred
    .map((id) => getMicroLesson(id, skillLevel))
    .filter((t): t is TechniqueCoachTip => !!t);

  return { tips, inferred_technique_ids: inferred };
}

export function resolveSkillLevelFromCount(practiceCount: number): ConfidenceLevel {
  if (practiceCount >= 8) return 'expert';
  if (practiceCount >= 5) return 'advanced';
  if (practiceCount >= 3) return 'intermediate';
  return 'beginner';
}

export function listTechniquesWithLessons(): { id: string; name: string; micro_lesson?: string }[] {
  return listKnowledgeNodes('technique')
    .filter((n) => n.attributes?.micro_lesson || n.description)
    .map((n) => ({
      id: n.id,
      name: n.display_name,
      micro_lesson: n.attributes?.micro_lesson as string | undefined,
    }));
}
