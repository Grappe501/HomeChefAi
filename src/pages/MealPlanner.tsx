import { useEffect, useState } from 'react';
import { Minus, Plus, Sparkles, ShoppingCart } from 'lucide-react';
import { mealsApi, ApiError } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { VoiceInput } from '@/components/VoiceButton';
import { MealWhyPanel } from '@/components/MealWhyPanel';
import type { MealPlan, MealPlanData, PlannedMeal } from '@/types';
import type { MealDirection } from '@/types/mealDirections';
import type { MealIntelligence } from '@/types/mealIntelligence';
import {
  COOKING_STYLES,
  COVERAGE_PRESETS,
  PLAN_LENGTH_OPTIONS,
  PLANNING_GOALS,
  countsForPreset,
  formatCoverageSummary,
  formatPlannedFor,
  formatPlanningLabel,
  shouldWarnHeavyPlan,
  totalMeals,
  type CookingStyleId,
  type CoveragePreset,
  type MealCounts,
  type PlanningGoalId,
} from '@/types/mealPlanCoverage';
import { groupSupplyList, SUPPLY_GROUP_ORDER } from '@/lib/supplyPlan';
import { formatMetricsSummary } from '@/lib/planMetrics';
import { mealTagLabel, type MealTagId } from '@/types/mealTags';

function cookNightOptions(dinnerSlots: number): number[] {
  const opts = new Set<number>();
  if (dinnerSlots >= 3) opts.add(3);
  if (dinnerSlots >= 5) opts.add(5);
  opts.add(Math.max(dinnerSlots, 1));
  return [...opts].sort((a, b) => a - b);
}

function mealReviewKey(m: PlannedMeal, index: number): string {
  return `${m.day}-${m.meal_type}-${index}`;
}

function dayName(day: number): string {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(day - 1) % 7];
}

function MealCountStepper({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-chef">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="tap-item !min-h-[44px] !py-2 px-3"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="tap-item !min-h-[44px] !py-2 px-3"
          aria-label={`Increase ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default function MealPlanner() {
  const { profile, refreshProfile } = useApp();
  const toast = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [planning, setPlanning] = useState(false);
  const [days, setDays] = useState<number>(7);
  const [preset, setPreset] = useState<CoveragePreset>('dinners_only');
  const [counts, setCounts] = useState<MealCounts>(() => countsForPreset('dinners_only', 7));
  const [people, setPeople] = useState(2);
  const [planningGoal, setPlanningGoal] = useState<PlanningGoalId>('use_inventory');
  const [cookingStyle, setCookingStyle] = useState<CookingStyleId>('profile_default');
  const [cookNights, setCookNights] = useState(7);
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<MealPlanData | null>(null);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [expandedWhyKey, setExpandedWhyKey] = useState<string | null>(null);
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [directions, setDirections] = useState<MealDirection[] | null>(null);
  const [directionsNote, setDirectionsNote] = useState('');
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [whyLoadingKey, setWhyLoadingKey] = useState<string | null>(null);
  const [intelligenceCache, setIntelligenceCache] = useState<Record<string, MealIntelligence>>({});

  useEffect(() => {
    mealsApi.list().then((r) => {
      setPlans(r.plans);
      if (r.plans[0]) setActivePlan(r.plans[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.household_size) setPeople(profile.household_size);
  }, [profile?.household_size]);

  useEffect(() => {
    setCookNights(counts.dinners || days);
  }, [counts.dinners, days]);

  const applyDays = (d: number) => {
    setDays(d);
    if (preset !== 'custom') {
      setCounts(countsForPreset(preset, d));
    } else {
      setCounts((c) => ({
        ...c,
        dinners: Math.min(c.dinners || d, d * 2),
      }));
    }
  };

  const applyPreset = (p: CoveragePreset) => {
    setPreset(p);
    if (p !== 'custom') setCounts(countsForPreset(p, days));
  };

  const setCustomCount = (key: keyof MealCounts, value: number) => {
    setPreset('custom');
    setCounts((c) => ({ ...c, [key]: value }));
  };

  const handlePlan = async () => {
    if (totalMeals(counts) === 0) {
      toast.error('Select at least one meal to plan.');
      return;
    }
    setPlanning(true);
    try {
      const res = await mealsApi.plan({
        days,
        breakfasts: counts.breakfasts,
        lunches: counts.lunches,
        dinners: counts.dinners,
        snacks: counts.snacks,
        people,
        planning_goal: planningGoal,
        cooking_style: cookingStyle,
        cook_nights: counts.dinners > 0 ? cookNights : undefined,
        coverage_preset: preset,
        budget: budget ? parseFloat(budget) : undefined,
        message: message || undefined,
        direction_id: selectedDirectionId || undefined,
      });
      setActivePlan(res.plan);
      setPlans([res.plan, ...plans]);
      await refreshProfile();
      toast.success(`Meal plan ready · +${res.xp_gained ?? 50} XP`);
      speak(`Your ${days}-day meal plan is ready!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not plan meals. Please try again.');
    } finally {
      setPlanning(false);
    }
  };

  const handleGetDirections = async () => {
    setPlanning(true);
    try {
      const result = await mealsApi.getDirections({ cooking_style: cookingStyle });
      setDirections(result.directions);
      setDirectionsNote(result.reasoning_note);
      setSelectedDirectionId(null);
      speak(`I found ${result.directions.length} cooking directions from your pantry.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setPlanning(false);
    }
  };

  const handleWhatCanIMake = async () => {
    setPlanning(true);
    try {
      const res = await mealsApi.whatCanIMake();
      if ('directions' in res && res.directions?.length) {
        setDirections(res.directions);
        setDirectionsNote(res.reasoning_note ?? '');
        setSuggestions(null);
        speak(`I found ${res.directions.length} directions from your pantry.`);
        return;
      }
      if ('suggestions' in res) {
        setSuggestions(res.suggestions);
        setDirections(null);
        speak(`I found ${res.suggestions.meals?.length || 0} meals you can make right now!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setPlanning(false);
    }
  };

  const showAddMealsHint =
    preset === 'dinners_only' && counts.breakfasts === 0 && counts.lunches === 0;

  const showHeavyPlanWarning = shouldWarnHeavyPlan(counts);

  const planPeople = activePlan?.plan_data?.coverage?.people;
  const planMetrics = activePlan?.plan_data?.metrics;
  const groupedSupply = activePlan?.plan_data?.shopping_list
    ? groupSupplyList(activePlan.plan_data.shopping_list)
    : null;

  const recordReview = async (key: string, meal: PlannedMeal, action: 'keep' | 'replace') => {
    if (!activePlan) return;
    setReviewingKey(key);
    try {
      if (action === 'replace') {
        const { plan } = await mealsApi.replaceMeal({
          plan_id: activePlan.id,
          meal_key: key,
          meal_name: meal.name,
          day: meal.day,
          meal_type: meal.meal_type,
          meal,
        });
        setActivePlan(plan);
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
        setIntelligenceCache((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.success('Replaced — Clara generated a new meal and saved your feedback.');
        return;
      }

      const { plan } = await mealsApi.reviewMeal({
        plan_id: activePlan.id,
        meal_key: key,
        meal_name: meal.name,
        day: meal.day,
        meal_type: meal.meal_type,
        action,
        meal,
      });
      setActivePlan(plan);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
      toast.success(
        action === 'keep'
          ? 'Kept — Clara saved this to your decision ledger.'
          : 'Replace noted — Clara will avoid this pattern next plan.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save review');
    } finally {
      setReviewingKey(null);
    }
  };

  const toggleExplainMeal = async (key: string, meal: PlannedMeal) => {
    if (expandedWhyKey === key) {
      setExpandedWhyKey(null);
      return;
    }
    setExpandedWhyKey(key);

    if (meal.intelligence || intelligenceCache[key]) return;

    setWhyLoadingKey(key);
    try {
      const { intelligence } = await mealsApi.explainMeal({
        meal,
        coverage: activePlan?.plan_data?.coverage,
        metrics: activePlan?.plan_data?.metrics,
        all_meals: activePlan?.plan_data?.meals,
      });
      setIntelligenceCache((prev) => ({ ...prev, [key]: intelligence }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not explain this meal');
      setExpandedWhyKey(null);
    } finally {
      setWhyLoadingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-sans font-semibold text-xl text-chef">Meal Planning</h2>

      <button onClick={handleWhatCanIMake} disabled={planning} className="btn-secondary w-full">
        <Sparkles size={18} /> What Can I Make Right Now?
      </button>

      <button onClick={handleGetDirections} disabled={planning} className="btn-secondary w-full">
        <Sparkles size={18} /> Explore 3 Cooking Directions
      </button>

      {directions && directions.length > 0 && (
        <section className="card space-y-3">
          <h3 className="font-semibold">Pick a Direction</h3>
          {directionsNote && <p className="text-sm text-chef-subtle">{directionsNote}</p>}
          {directions.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDirectionId(d.id)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                selectedDirectionId === d.id
                  ? 'border-chef bg-stainless-100'
                  : 'border-steel bg-white hover:border-chef/40'
              }`}
            >
              <p className="font-medium text-chef">{d.cuisine_label}</p>
              <p className="text-sm font-semibold mt-0.5">{d.title}</p>
              <p className="text-xs text-chef-subtle mt-1">{d.tagline}</p>
              {d.technique_hint && (
                <p className="text-xs text-chef-subtle mt-1">Technique: {d.technique_hint}</p>
              )}
            </button>
          ))}
          {selectedDirectionId && (
            <p className="text-xs text-chef-subtle">
              Selected direction will guide your next plan below.
            </p>
          )}
        </section>
      )}

      {suggestions && (
        <section className="card space-y-3">
          <h3 className="font-semibold">From Your Pantry</h3>
          {suggestions.meals?.map((m, i) => (
            <div key={i} className="border-b border-steel pb-2 last:border-0">
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-chef-subtle">{m.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {m.ingredients?.map((ing, j) => (
                  <span
                    key={j}
                    className={`text-xs px-2 py-0.5 rounded-full ${ing.in_inventory ? 'bg-stainless-200 text-chef' : 'bg-stainless-300 text-chef-subtle'}`}
                  >
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card space-y-4">
        <h3 className="font-semibold">Plan Ahead</h3>

        <div>
          <label className="text-sm text-chef-subtle">How many days?</label>
          <div className="flex gap-2 mt-2">
            {PLAN_LENGTH_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => applyDays(d)}
                className={`tap-item flex-1 py-2 ${days === d ? 'tap-item-selected' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-chef-subtle">What should I plan for?</label>
          <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
            {COVERAGE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`tap-item py-2 text-sm ${preset === p.id ? 'tap-item-selected' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="rounded-lg border border-steel bg-stainless-100 p-3 space-y-1">
            <MealCountStepper label="Breakfasts" value={counts.breakfasts} onChange={(n) => setCustomCount('breakfasts', n)} max={days * 2} />
            <MealCountStepper label="Lunches" value={counts.lunches} onChange={(n) => setCustomCount('lunches', n)} max={days * 2} />
            <MealCountStepper label="Dinners" value={counts.dinners} onChange={(n) => setCustomCount('dinners', n)} max={days * 2} />
            <MealCountStepper label="Snacks" value={counts.snacks} onChange={(n) => setCustomCount('snacks', n)} max={days * 2} />
          </div>
        )}

        <div className="rounded-lg bg-stainless-200 px-3 py-2">
          <p className="text-sm font-medium text-chef">{formatPlanningLabel(counts)}</p>
          <p className="text-xs text-chef-subtle mt-1">{formatPlannedFor(people)}</p>
          {showAddMealsHint && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-chef-subtle">Add breakfasts or lunches?</span>
              <button
                type="button"
                onClick={() => applyPreset('breakfast_dinner')}
                className="text-xs font-medium text-chef-muted underline"
              >
                + Breakfasts
              </button>
              <button
                type="button"
                onClick={() => applyPreset('lunch_dinner')}
                className="text-xs font-medium text-chef-muted underline"
              >
                + Lunches
              </button>
            </div>
          )}
        </div>

        {showHeavyPlanWarning && (
          <p className="text-xs text-chef-subtle border-l-2 border-chef-muted pl-3">
            Full-day plans take a little longer because Clara is planning more meals.
          </p>
        )}

        {counts.dinners > 0 && (
          <div>
            <label className="text-sm text-chef-subtle">How many dinners do you want to cook?</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {cookNightOptions(counts.dinners).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCookNights(n)}
                  className={`tap-item py-2 text-sm ${cookNights === n ? 'tap-item-selected' : ''}`}
                >
                  {n >= counts.dinners ? `Every night (${counts.dinners})` : `Cook ${n} nights`}
                </button>
              ))}
            </div>
            {cookNights < counts.dinners && (
              <p className="text-xs text-chef-subtle mt-2">
                Other nights: leftovers, sandwich, soup, pizza, or free night.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-sm text-chef-subtle">How many people should I plan for?</label>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="tap-item px-4"
              aria-label="Fewer people"
            >
              <Minus size={16} />
            </button>
            <span className="font-semibold text-lg tabular-nums w-8 text-center">{people}</span>
            <button
              type="button"
              onClick={() => setPeople(Math.min(12, people + 1))}
              className="tap-item px-4"
              aria-label="More people"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-chef-subtle">Cooking style (this plan)</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COOKING_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setCookingStyle(s.id)}
                className={`tap-item py-2 text-xs ${cookingStyle === s.id ? 'tap-item-selected' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-chef-subtle">Planning goal</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PLANNING_GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setPlanningGoal(g.id)}
                className={`tap-item py-2 text-xs ${planningGoal === g.id ? 'tap-item-selected' : ''}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-chef-subtle">Budget (optional)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="$100"
            className="input-field mt-1"
          />
        </div>

        <VoiceInput
          value={message}
          onChange={setMessage}
          placeholder="Tell me what you want... (or tap mic)"
          onSubmit={handlePlan}
        />

        <button onClick={handlePlan} disabled={planning} className="btn-primary w-full">
          {planning
            ? `Planning ${formatCoverageSummary(counts)}…`
            : `Plan ${days} Days · ${formatCoverageSummary(counts)}`}
        </button>
      </section>

      {activePlan && (
        <section className="card space-y-3">
          <div>
            <h3 className="font-semibold">{activePlan.title}</h3>
            {planPeople != null && (
              <p className="text-sm font-medium text-chef mt-2">{formatPlannedFor(planPeople)}</p>
            )}
            {activePlan.plan_data?.coverage && (
              <p className="text-xs text-chef-subtle mt-1">
                {formatCoverageSummary(activePlan.plan_data.coverage)}
              </p>
            )}
            {planMetrics && (
              <div className="mt-3 rounded-lg bg-stainless-100 border border-steel px-3 py-2 space-y-1">
                <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide">Clara&apos;s Notes</p>
                <p className="text-sm text-chef">
                  This plan uses {planMetrics.inventory_utilization_score}% of your current inventory.
                </p>
                {planMetrics.expiring_items_total > 0 && (
                  <p className="text-sm text-chef">
                    Should prevent {planMetrics.expiring_items_used} item
                    {planMetrics.expiring_items_used === 1 ? '' : 's'} from expiring.
                  </p>
                )}
                <p className="text-sm text-chef-subtle">
                  {formatMetricsSummary(planMetrics).grocery}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide">Review your plan</p>
          {activePlan.plan_data?.meals?.map((m, i) => {
            const key = mealReviewKey(m, i);
            const review = activePlan.plan_data.reviews?.[key]?.action;
            return (
              <div
                key={key}
                className={`border-b border-steel pb-3 ${review === 'keep' ? 'opacity-100' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-chef-subtle">
                      {dayName(m.day)} · Day {m.day} · {m.meal_type}
                    </p>
                    <p className="font-medium">
                      {m.name}
                      {m.name.toLowerCase().startsWith('leftover') && (
                        <span className="ml-2 text-xs font-normal text-chef-subtle">· uses prior dinner</span>
                      )}
                    </p>
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-stainless-200 text-chef-subtle">
                            {mealTagLabel(tag as MealTagId)}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.description && (
                      <p className="text-xs text-chef-subtle mt-0.5 line-clamp-2">{m.description}</p>
                    )}
                    {(m.intelligence?.ingredient_trivia ?? intelligenceCache[key]?.ingredient_trivia) && (
                      <p className="text-[10px] leading-snug text-chef-subtle/70 italic mt-1.5 pr-2">
                        {m.intelligence?.ingredient_trivia ?? intelligenceCache[key]?.ingredient_trivia}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => recordReview(key, m, 'keep')}
                    disabled={reviewingKey === key}
                    className={`tap-item flex-1 py-2 text-xs ${review === 'keep' ? 'tap-item-selected' : ''}`}
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => recordReview(key, m, 'replace')}
                    disabled={reviewingKey === key}
                    className={`tap-item flex-1 py-2 text-xs ${review === 'replace' ? 'tap-item-selected' : ''}`}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExplainMeal(key, m)}
                    disabled={whyLoadingKey === key}
                    className={`tap-item flex-1 py-2 text-xs ${expandedWhyKey === key ? 'tap-item-selected' : ''}`}
                  >
                    {whyLoadingKey === key ? 'Analyzing…' : 'Why this?'}
                  </button>
                </div>
                {expandedWhyKey === key && (
                  <div className="mt-3">
                    <MealWhyPanel
                      meal={m}
                      intelligence={intelligenceCache[key] ?? m.intelligence}
                      loading={whyLoadingKey === key}
                      onClose={() => setExpandedWhyKey(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {groupedSupply && activePlan.plan_data?.shopping_list && activePlan.plan_data.shopping_list.length > 0 && (
            <div className="mt-4 pt-3 border-t border-steel">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <ShoppingCart size={14} /> Kitchen Supply Plan
              </h4>
              <div className="mt-3 space-y-4">
                {SUPPLY_GROUP_ORDER.map(({ id, label }) => {
                  const items = groupedSupply[id];
                  if (!items.length) return null;
                  return (
                    <div key={id}>
                      <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide mb-1">{label}</p>
                      <ul className="space-y-1">
                        {items.map((s, i) => (
                          <li key={i} className="text-sm flex justify-between">
                            <span>{s.name} — {s.quantity} {s.unit}</span>
                            {s.estimated_price != null && (
                              <span className="text-chef-subtle">${s.estimated_price.toFixed(2)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {activePlan.plan_data.estimated_cost != null && (
                <p className="text-sm font-semibold mt-3 text-chef">
                  Est. total: ${activePlan.plan_data.estimated_cost.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {plans.length > 1 && (
        <section className="card">
          <h3 className="font-semibold text-sm text-chef-subtle">Previous Plans</h3>
          {plans.slice(1, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlan(p)}
              className="block w-full text-left py-2 text-sm hover:text-chef-muted"
            >
              {p.title} — {p.start_date}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
