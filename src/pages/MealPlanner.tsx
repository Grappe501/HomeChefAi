import { useEffect, useState } from 'react';
import { Sparkles, ShoppingCart } from 'lucide-react';
import { mealsApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { VoiceInput } from '@/components/VoiceButton';
import type { MealPlan, MealPlanData } from '@/types';

export default function MealPlanner() {
  const { refreshProfile } = useApp();
  const toast = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [planning, setPlanning] = useState(false);
  const [days, setDays] = useState(7);
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

  const handlePlan = async () => {
    setPlanning(true);
    try {
      const res = await mealsApi.plan({
        days,
        budget: budget ? parseFloat(budget) : undefined,
        message: message || undefined,
      });
      setActivePlan(res.plan);
      setPlans([res.plan, ...plans]);
      await refreshProfile();
      toast.success(`Meal plan ready · +${res.xp_gained ?? 50} XP`);
      speak(`Your ${days}-day meal plan is ready!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Planning failed');
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
                  <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${ing.in_inventory ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
            {[1, 3, 5, 7, 14].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`tap-item flex-1 py-2 ${days === d ? 'tap-item-selected' : ''}`}
              >
                {d}
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
          {planning ? 'Planning meals…' : `Plan ${days} Days of Meals`}
        </button>
      </section>

      {activePlan && (
        <section className="card space-y-3">
          <h3 className="font-semibold">{activePlan.title}</h3>
          {activePlan.plan_data?.meals?.map((m, i) => (
            <div key={i} className="flex justify-between items-start border-b border-steel pb-2">
              <div>
                <p className="text-xs text-chef-subtle">Day {m.day} · {m.meal_type}</p>
                <p className="font-medium">{m.name}</p>
                {m.prep_time_minutes && <p className="text-xs text-steel-dark">{m.prep_time_minutes} min</p>}
              </div>
            </div>
          ))}
          {activePlan.plan_data?.shopping_list && activePlan.plan_data.shopping_list.length > 0 && (
            <div className="mt-4 pt-3 border-t border-steel">
              <h4 className="font-semibold text-sm flex items-center gap-1"><ShoppingCart size={14} /> Kitchen Supply Plan</h4>
              <ul className="mt-2 space-y-1">
                {activePlan.plan_data.shopping_list.map((s, i) => (
                  <li key={i} className="text-sm flex justify-between">
                    <span>{s.name} — {s.quantity} {s.unit}</span>
                    {s.estimated_price != null && <span className="text-chef-subtle">${s.estimated_price.toFixed(2)}</span>}
                  </li>
                ))}
              </ul>
              {activePlan.plan_data.estimated_cost != null && (
                <p className="text-sm font-semibold mt-2 text-chef">
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
            <button key={p.id} onClick={() => setActivePlan(p)} className="block w-full text-left py-2 text-sm hover:text-chef-muted">
              {p.title} — {p.start_date}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
