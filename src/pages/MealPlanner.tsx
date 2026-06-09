import { useEffect, useState } from 'react';
import { Minus, Plus, Sparkles, ShoppingCart } from 'lucide-react';
import { mealsApi, ApiError } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { VoiceInput } from '@/components/VoiceButton';
import type { MealPlan, MealPlanData } from '@/types';
import {
  COVERAGE_PRESETS,
  PLAN_LENGTH_OPTIONS,
  PLANNING_GOALS,
  countsForPreset,
  formatCoverageSummary,
  formatPlannedFor,
  formatPlanningLabel,
  shouldWarnHeavyPlan,
  totalMeals,
  type CoveragePreset,
  type MealCounts,
  type PlanningGoalId,
} from '@/types/mealPlanCoverage';
import { groupSupplyList, SUPPLY_GROUP_ORDER } from '@/lib/supplyPlan';

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
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<MealPlanData | null>(null);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    mealsApi.list().then((r) => {
      setPlans(r.plans);
      if (r.plans[0]) setActivePlan(r.plans[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.household_size) setPeople(profile.household_size);
  }, [profile?.household_size]);

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
        coverage_preset: preset,
        budget: budget ? parseFloat(budget) : undefined,
        message: message || undefined,
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

  const handleWhatCanIMake = async () => {
    setPlanning(true);
    try {
      const { suggestions: s } = await mealsApi.whatCanIMake();
      setSuggestions(s);
      speak(`I found ${s.meals?.length || 0} meals you can make right now!`);
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
  const groupedSupply = activePlan?.plan_data?.shopping_list
    ? groupSupplyList(activePlan.plan_data.shopping_list)
    : null;

  return (
    <div className="space-y-5">
      <h2 className="font-sans font-semibold text-xl text-chef">Meal Planning</h2>

      <button onClick={handleWhatCanIMake} disabled={planning} className="btn-secondary w-full">
        <Sparkles size={18} /> What Can I Make Right Now?
      </button>

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
          </div>
          {activePlan.plan_data?.meals?.map((m, i) => (
            <div key={i} className="flex justify-between items-start border-b border-steel pb-2">
              <div>
                <p className="text-xs text-chef-subtle">Day {m.day} · {m.meal_type}</p>
                <p className="font-medium">
                  {m.name}
                  {m.name.toLowerCase().startsWith('leftover') && (
                    <span className="ml-2 text-xs font-normal text-chef-subtle">· uses prior dinner</span>
                  )}
                </p>
                {m.description && (
                  <p className="text-xs text-chef-subtle mt-0.5">{m.description}</p>
                )}
                {m.prep_time_minutes != null && (
                  <p className="text-xs text-steel-dark">{m.prep_time_minutes} min</p>
                )}
              </div>
            </div>
          ))}
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
