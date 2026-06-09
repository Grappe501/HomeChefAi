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

/** How each multi-course dinner/lunch should be composed */
export type CourseMenuStyleId =
  | 'balanced'
  | 'fewest_ingredients'
  | 'budget'
  | 'gourmet'
  | 'sophisticated'
  | 'comfort'
  | 'quick';

export const DEFAULT_MENU_STYLE: CourseMenuStyleId = 'balanced';

export const COURSE_MENU_STYLES: {
  id: CourseMenuStyleId;
  label: string;
  hint: string;
}[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    hint: 'Well-rounded courses — variety without extremes',
  },
  {
    id: 'fewest_ingredients',
    label: 'Fewest ingredients',
    hint: 'One protein, shared pantry — full menu from minimal shopping',
  },
  {
    id: 'budget',
    label: 'Least expensive',
    hint: 'Stretch staples, minimize grocery spend across every course',
  },
  {
    id: 'gourmet',
    label: 'Most gourmet',
    hint: 'Premium touches — restaurant-worthy plating and ingredients',
  },
  {
    id: 'sophisticated',
    label: 'Most sophisticated',
    hint: 'Technique-forward — refined sauces, layers, and pairings',
  },
  {
    id: 'comfort',
    label: 'Comfort feast',
    hint: 'Hearty, familiar, crowd-pleasing multi-course spread',
  },
  {
    id: 'quick',
    label: 'Quick courses',
    hint: 'Full menu structure — each course under 20 minutes',
  },
];

export function menuStyleLabel(id: CourseMenuStyleId): string {
  return COURSE_MENU_STYLES.find((s) => s.id === id)?.label ?? 'Balanced';
}

export function menuStylePrompt(
  style: CourseMenuStyleId | undefined,
  depth: MealCourseDepthConfig,
  counts: { dinners: number; lunches: number },
): string {
  const id = style ?? DEFAULT_MENU_STYLE;
  const multiCourse =
    (counts.dinners > 0 && depth.dinner > 1) || (counts.lunches > 0 && depth.lunch > 1);
  if (!multiCourse && id === 'balanced') return '';

  const shared = multiCourse
    ? 'Apply this philosophy to EVERY multi-course dinner and lunch slot — all courses in a slot share one menu theme.'
    : 'Apply where relevant to composed meals.';

  const map: Record<CourseMenuStyleId, string> = {
    balanced: multiCourse
      ? `${shared} Balance starter, main, and dessert — complementary flavors, reasonable prep.`
      : '',
    fewest_ingredients: `${shared} MINIMIZE unique ingredients across all courses in each slot:
- Reuse the same protein, starch, and aromatics across starter, main, side, and dessert where sensible (e.g., chicken → salad + main + stock-based soup).
- Target ≤8 distinct grocery items per full-course dinner (excluding salt, oil, pepper).
- List shared ingredients explicitly in each course description.
- Maximize pantry overlap — tag meals "pantry_stretch".`,
    budget: `${shared} LEAST EXPENSIVE full-course menus:
- Favor rice, beans, pasta, eggs, chicken thighs, seasonal veg, and pantry staples.
- Avoid specialty cheese, seafood, or premium cuts unless already in inventory.
- Estimate lowest reasonable cost per slot; keep shopping_list lean.
- Tag budget-friendly mains "budget_friendly".`,
    gourmet: `${shared} MOST GOURMET execution:
- Premium ingredients where pantry allows — good butter, fresh herbs, quality protein.
- Restaurant-style composition — thoughtful garnish, contrast, and temperature.
- Name courses like a bistro menu. Tag "dinner_party" when appropriate.`,
    sophisticated: `${shared} MOST SOPHISTICATED technique:
- Layered flavors — fond, reduction, emulsion, or proper sear where fitting.
- Courses should teach a skill (deglaze, mount butter, brine, temper).
- Wine-pairing mindset — acid, fat, and texture balance across the menu.
- Reference techniques in descriptions; avoid "dump and stir" mains.`,
    comfort: `${shared} COMFORT FEAST — generous, familiar, soul-satisfying:
- Mashed, roasted, braised, or baked formats; shared serving platters.
- Dessert can be simple (cobbler, bread pudding). Tag "crowd_favorite".`,
    quick: `${shared} QUICK COURSES — full structure, minimal time:
- Each course ≤20 min active prep; use shortcuts (store-bought stock, pre-washed greens).
- Tag every course slot "30_minutes" or "easy_night" where honest.`,
  };

  const line = map[id];
  if (!line) return '';
  return `Course menu style (${menuStyleLabel(id)}):\n${line}`;
}
