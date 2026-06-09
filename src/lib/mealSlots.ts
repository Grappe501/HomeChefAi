import type { PlannedMeal } from '@/types';
import {
  COURSE_LABELS,
  normalizeCourse,
  slotId,
  sortByCourse,
  type MealCourseId,
} from '@/types/mealCourses';

export interface MealSlot {
  id: string;
  day: number;
  meal_type: PlannedMeal['meal_type'];
  courses: PlannedMeal[];
  mainCourse?: PlannedMeal;
  courseCount: number;
  totalPrepMinutes: number;
  isEasyNight: boolean;
}

export function mealSlotKey(day: number, mealType: string): string {
  return slotId(day, mealType);
}

export function groupMealsIntoSlots(meals: PlannedMeal[]): MealSlot[] {
  const map = new Map<string, PlannedMeal[]>();

  for (const meal of meals) {
    const key = meal.slot_id ?? mealSlotKey(meal.day, meal.meal_type);
    const list = map.get(key) ?? [];
    list.push({ ...meal, slot_id: key, course: normalizeCourse(meal.course) });
    map.set(key, list);
  }

  const slots: MealSlot[] = [];
  for (const [id, courseMeals] of map) {
    const sorted = sortByCourse(courseMeals);
    const first = sorted[0];
    const mainCourse = sorted.find((m) => normalizeCourse(m.course) === 'main') ?? sorted[0];
    const isEasyNight = sorted.some((m) => m.tags?.includes('easy_night'));
    slots.push({
      id,
      day: first.day,
      meal_type: first.meal_type,
      courses: sorted,
      mainCourse,
      courseCount: sorted.length,
      totalPrepMinutes: sorted.reduce((s, m) => s + (m.prep_time_minutes ?? 0), 0),
      isEasyNight,
    });
  }

  return slots.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    const order: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
    return (order[a.meal_type] ?? 9) - (order[b.meal_type] ?? 9);
  });
}

export function slotDisplayTitle(slot: MealSlot): string {
  if (slot.isEasyNight) return slot.mainCourse?.name ?? 'Easy night';
  if (slot.courseCount <= 1) return slot.mainCourse?.name ?? 'Untitled';
  const main = slot.mainCourse?.name ?? 'Menu';
  return main.replace(/\s+(skillet|baked|grilled)$/i, '') + ' Menu';
}

export function slotSubtitle(slot: MealSlot): string {
  if (slot.courseCount <= 1) {
    return slot.mainCourse?.description?.slice(0, 80) ?? '';
  }
  const names = slot.courses.map((c) => COURSE_LABELS[normalizeCourse(c.course)]).join(' · ');
  return `${slot.courseCount} courses · ${names}`;
}

export function courseLabel(course?: string): string {
  return COURSE_LABELS[normalizeCourse(course as MealCourseId | undefined)];
}

export function dayName(day: number): string {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(day - 1) % 7];
}

export function mealTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
