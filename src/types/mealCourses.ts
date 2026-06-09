/** Multi-course meal structure for weekly plans */

export type MealCourseId =
  | 'appetizer'
  | 'soup'
  | 'salad'
  | 'main'
  | 'side'
  | 'dessert'
  | 'bread'
  | 'beverage';

export type DinnerCourseDepth = 1 | 3 | 4 | 5;
export type LunchCourseDepth = 0 | 2 | 3;

export interface MealCourseDepthConfig {
  dinner: DinnerCourseDepth;
  lunch: LunchCourseDepth;
  includeBreakfast: boolean;
}

export const DEFAULT_COURSE_DEPTH: MealCourseDepthConfig = {
  dinner: 4,
  lunch: 2,
  includeBreakfast: false,
};

export const DINNER_COURSE_DEPTH_OPTIONS: { value: DinnerCourseDepth; label: string; hint: string }[] = [
  { value: 1, label: 'Main only', hint: 'One dish — quick weeknight' },
  { value: 3, label: '3 courses', hint: 'Starter · main · dessert' },
  { value: 4, label: '4 courses', hint: 'Starter · main · side · dessert' },
  { value: 5, label: '5 courses', hint: 'Full dinner — starter · soup · main · side · dessert' },
];

export const LUNCH_COURSE_DEPTH_OPTIONS: { value: LunchCourseDepth; label: string; hint: string }[] = [
  { value: 0, label: 'Skip lunch', hint: 'No lunch slots in plan' },
  { value: 2, label: '2 courses', hint: 'Main · side' },
  { value: 3, label: '3 courses', hint: 'Soup · main · side' },
];

export const COURSE_ORDER: MealCourseId[] = [
  'appetizer',
  'soup',
  'salad',
  'main',
  'side',
  'bread',
  'dessert',
  'beverage',
];

export const DINNER_COURSES: Record<DinnerCourseDepth, MealCourseId[]> = {
  1: ['main'],
  3: ['appetizer', 'main', 'dessert'],
  4: ['appetizer', 'main', 'side', 'dessert'],
  5: ['appetizer', 'soup', 'main', 'side', 'dessert'],
};

export const LUNCH_COURSES: Record<2 | 3, MealCourseId[]> = {
  2: ['main', 'side'],
  3: ['soup', 'main', 'side'],
};

export const COURSE_LABELS: Record<MealCourseId, string> = {
  appetizer: 'Starter',
  soup: 'Soup',
  salad: 'Salad',
  main: 'Main',
  side: 'Side',
  dessert: 'Dessert',
  bread: 'Bread',
  beverage: 'Beverage',
};

export function slotId(day: number, mealType: string): string {
  return `d${day}-${mealType}`;
}

export function coursesForMealType(
  mealType: string,
  depth: MealCourseDepthConfig,
): MealCourseId[] {
  if (mealType === 'dinner') return DINNER_COURSES[depth.dinner];
  if (mealType === 'lunch') {
    if (depth.lunch === 0) return [];
    return LUNCH_COURSES[depth.lunch as 2 | 3];
  }
  if (mealType === 'breakfast') return ['main'];
  return ['main'];
}

export function courseDepthPrompt(depth: MealCourseDepthConfig, counts: {
  breakfasts: number;
  lunches: number;
  dinners: number;
}): string {
  const lines: string[] = ['Multi-course structure (IMPORTANT):'];

  if (counts.dinners > 0) {
    const courses = DINNER_COURSES[depth.dinner];
    if (courses.length === 1) {
      lines.push('- Each dinner slot = ONE main dish (course: "main").');
    } else {
      lines.push(
        `- Each dinner slot = ${courses.length} separate meal entries sharing the same day and meal_type "dinner".`,
      );
      lines.push(`- Dinner courses in order: ${courses.map((c) => `"${c}"`).join(', ')}.`);
      lines.push('- Use the same slot_id for all courses in one dinner (format: "d1-dinner" for day 1).');
      lines.push('- Main course name should reflect the overall menu theme; other courses complement it.');
    }
  }

  if (counts.lunches > 0 && depth.lunch > 0) {
    const courses = LUNCH_COURSES[depth.lunch as 2 | 3];
    lines.push(
      `- Each lunch slot = ${courses.length} entries with courses: ${courses.map((c: MealCourseId) => `"${c}"`).join(', ')}.`,
    );
    lines.push('- Use slot_id like "d1-lunch" for all courses in one lunch.');
  }

  if (counts.breakfasts > 0) {
    if (depth.includeBreakfast) {
      lines.push('- Breakfast = single simple course ("main") — quick items only.');
    } else {
      lines.push('- Skip breakfast entirely (0 breakfast entries).');
    }
  } else {
    lines.push('- Do NOT plan breakfasts.');
  }

  lines.push(
    'Each meal entry MUST include: "course" (appetizer|soup|salad|main|side|dessert|bread|beverage), "slot_id" (e.g. d3-dinner).',
  );
  lines.push('Easy nights (leftover/sandwich/pizza) = single "main" course only.');

  return lines.join('\n');
}

export function normalizeCourse(raw?: string): MealCourseId {
  const c = (raw ?? 'main').toLowerCase() as MealCourseId;
  if (COURSE_ORDER.includes(c)) return c;
  return 'main';
}

export function sortByCourse<T extends { course?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = COURSE_ORDER.indexOf(normalizeCourse(a.course));
    const bi = COURSE_ORDER.indexOf(normalizeCourse(b.course));
    return ai - bi;
  });
}
