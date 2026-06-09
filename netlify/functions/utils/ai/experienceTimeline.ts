/**
 * Experience timeline builder — hosting events (Phase 8).
 */

import type { InventoryItem, Profile, ShoppingItem } from '../../../../src/types/index.js';
import { getKnowledgeNode, listKnowledgeNodes } from './knowledgeLoader.js';
import { expertsForIntent } from './brainRegistry.js';
import { formatInventoryForAI } from '../inventoryContext.js';

export type ExperienceType = 'potluck' | 'dinner_party' | 'game_day' | 'holiday';

export interface TimelineStep {
  time: string;
  task: string;
  category: string;
  offset_hours: number;
}

export interface ExperienceMenuItem {
  course: string;
  name: string;
  description: string;
  prep_time_minutes: number;
  tags: string[];
}

export interface ExperiencePlanResult {
  experience_type: ExperienceType;
  hosting_knowledge_id: string;
  guest_count: number;
  start_time: string;
  menu: ExperienceMenuItem[];
  timeline: TimelineStep[];
  shopping_list: ShoppingItem[];
  evidence: string[];
  expert_ids: string[];
  summary: string;
}

const TYPE_TO_HOSTING: Record<ExperienceType, string> = {
  potluck: 'hosting.potluck',
  dinner_party: 'hosting.dinner_party',
  game_day: 'hosting.game_day',
  holiday: 'hosting.holiday',
};

function parseStartTime(startTime: string): { hours: number; minutes: number } {
  const m = startTime.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return { hours: 18, minutes: 0 };
  return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) };
}

function formatClock(baseHours: number, baseMinutes: number, offsetHours: number): string {
  const total = baseHours * 60 + baseMinutes + offsetHours * 60;
  const h = ((Math.floor(total / 60) % 24) + 24) % 24;
  const min = ((total % 60) + 60) % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`;
}

export function buildExperienceTimeline(
  experienceType: ExperienceType,
  startTime: string,
  guestCount: number,
): TimelineStep[] {
  const hostingId = TYPE_TO_HOSTING[experienceType];
  const node = getKnowledgeNode(hostingId);
  const template = (node?.attributes?.timeline_template as { offset_hours: number; task: string; category: string }[]) ?? [];
  const { hours, minutes } = parseStartTime(startTime);

  return template.map((step) => ({
    offset_hours: step.offset_hours,
    task: step.task,
    category: step.category,
    time: formatClock(hours, minutes, step.offset_hours),
  }));
}

function defaultMenu(
  experienceType: ExperienceType,
  guestCount: number,
  cuisineStyle?: string,
): ExperienceMenuItem[] {
  const style = cuisineStyle?.toLowerCase() ?? 'comfort';
  const scale = guestCount <= 6 ? 'intimate' : guestCount <= 10 ? 'medium' : 'crowd';

  switch (experienceType) {
    case 'dinner_party':
      return [
        { course: 'starter', name: style.includes('italian') ? 'Bruschetta with tomato & basil' : 'Seasonal salad with vinaigrette', description: 'Light opener while guests arrive', prep_time_minutes: 20, tags: ['crowd_favorite', 'dinner_party'] },
        { course: 'main', name: style.includes('italian') ? 'Herb-roasted chicken with lemon potatoes' : 'Seared protein with pan sauce', description: `Scaled for ${guestCount} guests`, prep_time_minutes: 55, tags: ['dinner_party', 'crowd_favorite'] },
        { course: 'dessert', name: 'Affogato or simple fruit & cheese', description: 'Easy finish — can be mostly store-bought', prep_time_minutes: 10, tags: ['easy_night'] },
      ];
    case 'potluck':
      return [
        { course: 'your_dish', name: 'Your signature shareable main', description: 'You host logistics — bring one reliable crowd-pleaser', prep_time_minutes: 45, tags: ['crowd_favorite', 'potluck'] },
        { course: 'coordination', name: 'Guest category assignments', description: 'App / main / side / dessert slots to avoid duplicates', prep_time_minutes: 0, tags: ['dinner_party'] },
      ];
    case 'game_day':
      return [
        { course: 'snacks', name: 'Wings or sliders', description: 'Handheld hero item', prep_time_minutes: 40, tags: ['crowd_favorite', '30_minutes'] },
        { course: 'snacks', name: 'Chips, dip & veggie platter', description: 'Set-and-forget station', prep_time_minutes: 15, tags: ['easy_night'] },
        { course: 'warm', name: 'Slow-cooker chili or queso', description: 'Holds warm through the game', prep_time_minutes: 20, tags: ['leftovers_friendly'] },
      ];
    case 'holiday':
      return [
        { course: 'main', name: 'Centerpiece roast or turkey', description: 'Plan oven timeline first', prep_time_minutes: 180, tags: ['crowd_favorite', 'freezer_friendly'] },
        { course: 'side', name: 'Classic dressing & roasted vegetables', description: 'Make-ahead friendly sides', prep_time_minutes: 60, tags: ['leftovers_friendly'] },
        { course: 'dessert', name: 'Family pie or tradition dessert', description: 'Link to a tradition node if you have one', prep_time_minutes: 45, tags: ['crowd_favorite'] },
      ];
    default:
      return [];
  }
}

export function buildExperiencePlan(input: {
  experience_type: ExperienceType;
  guest_count: number;
  start_time: string;
  cuisine_style?: string;
  inventory: InventoryItem[];
  profile: Profile;
  message?: string;
}): ExperiencePlanResult {
  const hostingId = TYPE_TO_HOSTING[input.experience_type];
  const hosting = getKnowledgeNode(hostingId);
  const experts = expertsForIntent('hosting');
  const timeline = buildExperienceTimeline(input.experience_type, input.start_time, input.guest_count);
  const menu = defaultMenu(input.experience_type, input.guest_count, input.cuisine_style);

  const shopping_list: ShoppingItem[] = [];
  if (input.inventory.length < 5) {
    shopping_list.push({ name: 'Fresh herbs', quantity: 1, unit: 'bunch', estimated_price: 3, supply_group: 'staple' });
    shopping_list.push({ name: 'Guest-count protein', quantity: input.guest_count, unit: 'servings', estimated_price: input.guest_count * 4, supply_group: 'dinner' });
  }

  const hints = (hosting?.attributes?.menu_hints as string[] | undefined) ?? [];
  const summary = [
    `${hosting?.display_name ?? input.experience_type} for ${input.guest_count} guests starting ${input.start_time}.`,
    hints.length ? `Menu direction: ${hints.join('; ')}.` : '',
    input.message ? `Chef note: ${input.message}` : '',
    `Pantry (${input.inventory.length} items) considered.`,
  ].filter(Boolean).join(' ');

  return {
    experience_type: input.experience_type,
    hosting_knowledge_id: hostingId,
    guest_count: input.guest_count,
    start_time: input.start_time,
    menu,
    timeline,
    shopping_list,
    evidence: [hostingId, ...listKnowledgeNodes('tradition').slice(0, 2).map((n) => n.id)],
    expert_ids: experts.map((e) => e.id),
    summary,
  };
}

export async function enrichExperiencePlanWithAI(
  plan: ExperiencePlanResult,
  inventory: InventoryItem[],
  profile: Profile,
  message?: string,
): Promise<ExperiencePlanResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return plan;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Refine this ${plan.experience_type} menu for ${plan.guest_count} guests. Return JSON {"menu":[{"course":"string","name":"string","description":"string","prep_time_minutes":number,"tags":["dinner_party"]}]}. Pantry:\n${formatInventoryForAI(inventory)}\nCuisines: ${profile.cuisine_preferences.join(', ')}\n${message ?? ''}\nCurrent: ${JSON.stringify(plan.menu)}`,
        }],
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) return plan;
    const data = await response.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as { menu?: ExperienceMenuItem[] };
    if (parsed.menu?.length) return { ...plan, menu: parsed.menu };
  } catch {
    /* deterministic fallback */
  }
  return plan;
}
