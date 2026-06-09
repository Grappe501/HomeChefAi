import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, MessageCircle, ShoppingCart, BookOpen } from 'lucide-react';
import { mealsApi } from '@/lib/api';
import { MealWhyPanel } from '@/components/MealWhyPanel';
import { MealNutritionPanel } from '@/components/MealNutritionPanel';
import type { MealPlan, PlannedMeal } from '@/types';
import type { MealIntelligence } from '@/types/mealIntelligence';
import {
  courseLabel,
  dayName,
  groupMealsIntoSlots,
  mealTypeLabel,
  slotDisplayTitle,
  slotSubtitle,
} from '@/lib/mealSlots';
import { COURSE_LABELS } from '@/types/mealCourses';

export default function MealSlotDetail() {
  const { planId, slotId } = useParams<{ planId: string; slotId: string }>();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [whyKey, setWhyKey] = useState<string | null>(null);
  const [intelligenceCache, setIntelligenceCache] = useState<Record<string, MealIntelligence>>({});

  useEffect(() => {
    mealsApi.list().then((r) => {
      const found = r.plans.find((p) => p.id === planId);
      setPlan(found ?? null);
    }).finally(() => setLoading(false));
  }, [planId]);

  const slot = useMemo(() => {
    if (!plan?.plan_data?.meals) return null;
    return groupMealsIntoSlots(plan.plan_data.meals).find((s) => s.id === slotId) ?? null;
  }, [plan, slotId]);

  const loadWhy = async (meal: PlannedMeal, key: string) => {
    if (intelligenceCache[key] || meal.intelligence) {
      setWhyKey(whyKey === key ? null : key);
      return;
    }
    setWhyKey(key);
    try {
      const { intelligence } = await mealsApi.explainMeal({
        meal,
        all_meals: plan?.plan_data?.meals,
        coverage: plan?.plan_data?.coverage,
        metrics: plan?.plan_data?.metrics,
      });
      setIntelligenceCache((prev) => ({ ...prev, [key]: intelligence }));
    } catch {
      /* optional */
    }
  };

  if (!planId || !slotId) return <Navigate to="/meals" replace />;
  if (!loading && !slot) return <Navigate to="/meals" replace />;

  if (loading || !slot) {
    return <div className="card text-chef-subtle text-sm py-8 text-center">Loading menu…</div>;
  }

  return (
    <div className="space-y-5 pb-10">
      <Link to="/meals" className="inline-flex items-center gap-1 text-sm text-chef-muted hover:text-chef min-h-[44px]">
        <ArrowLeft size={16} /> Meal plan
      </Link>

      <header className="card bg-stainless-100 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-chef-subtle">
          {dayName(slot.day)} · Day {slot.day} · {mealTypeLabel(slot.meal_type)}
        </p>
        <h1 className="font-sans font-semibold text-xl text-chef flex items-center gap-2">
          <ChefHat size={22} />
          {slotDisplayTitle(slot)}
        </h1>
        <p className="text-sm text-chef-subtle">{slotSubtitle(slot)}</p>
        <div className="flex flex-wrap gap-3 text-xs text-chef-subtle pt-1">
          <span className="flex items-center gap-1">
            <Clock size={14} /> ~{slot.totalPrepMinutes || '—'} min total
          </span>
          {slot.courseCount > 1 && (
            <span>{slot.courseCount} courses</span>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="section-label">Course breakdown</h2>
        {slot.courses.map((course, idx) => {
          const key = `${slot.id}-${course.course ?? idx}`;
          const open = expandedCourse === key;
          const intel = course.intelligence ?? intelligenceCache[key];
          return (
            <article key={key} className="card space-y-2">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedCourse(open ? null : key)}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-copper-600">
                      {courseLabel(course.course)}
                    </p>
                    <p className="font-medium text-chef">{course.name}</p>
                  </div>
                  {course.prep_time_minutes != null && (
                    <span className="text-xs text-chef-subtle shrink-0">{course.prep_time_minutes}m</span>
                  )}
                </div>
                {course.description && !open && (
                  <p className="text-sm text-chef-subtle mt-1 line-clamp-2">{course.description}</p>
                )}
              </button>

              {open && (
                <div className="pt-2 border-t border-steel space-y-3 text-sm">
                  {course.description && (
                    <p className="text-chef-subtle">{course.description}</p>
                  )}
                  {course.ingredients?.length > 0 && (
                    <ul className="text-chef-subtle space-y-0.5">
                      {course.ingredients.map((ing) => (
                        <li key={`${ing.name}-${ing.unit}`}>
                          {ing.in_inventory ? '✓ ' : '○ '}
                          {ing.quantity} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => loadWhy(course, key)}
                    className="text-xs font-medium text-chef-muted underline"
                  >
                    Why this course?
                  </button>
                  {whyKey === key && intel && (
                    <MealWhyPanel intelligence={intel} meal={course} onClose={() => setWhyKey(null)} />
                  )}
                  {intel?.nutrition && (
                    <MealNutritionPanel compact nutrition={intel.nutrition} />
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {slot.courseCount > 1 && (
        <section className="card bg-stainless-50 space-y-2">
          <h2 className="text-sm font-semibold text-chef">Serving order</h2>
          <ol className="text-sm text-chef-subtle list-decimal list-inside space-y-1">
            {slot.courses.map((c) => (
              <li key={c.name}>{COURSE_LABELS[c.course ?? 'main']}: {c.name}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="section-label">Go deeper</h2>
        <div className="grid grid-cols-1 gap-2">
          <Link to="/assistant" className="action-tile flex-row justify-start gap-3 !min-h-[52px]">
            <MessageCircle size={20} className="text-chef shrink-0" />
            <span className="text-sm font-medium">Ask Clara about this menu</span>
          </Link>
          <Link to="/recipes" className="action-tile flex-row justify-start gap-3 !min-h-[52px]">
            <ChefHat size={20} className="text-chef shrink-0" />
            <span className="text-sm font-medium">Browse similar recipes</span>
          </Link>
          <Link to="/meals" className="action-tile flex-row justify-start gap-3 !min-h-[52px]">
            <ShoppingCart size={20} className="text-chef shrink-0" />
            <span className="text-sm font-medium">View full shopping list</span>
          </Link>
          <Link to="/learn" className="action-tile flex-row justify-start gap-3 !min-h-[52px]">
            <BookOpen size={20} className="text-chef shrink-0" />
            <span className="text-sm font-medium">Kitchen Academy — techniques & history</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
