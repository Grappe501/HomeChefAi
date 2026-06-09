import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChefHat, Search } from 'lucide-react';
import { mealsApi } from '@/lib/api';
import type { DishMatch } from '@/types/dish';

const MEAL_FILTERS = ['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function RecipeIdeas() {
  const [dishes, setDishes] = useState<DishMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof MEAL_FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    setLoading(true);
    mealsApi
      .recipeIdeas({ limit: 80 })
      .then((r) => {
        setDishes(r.dishes);
        setSummary(r.inventory_summary);
      })
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      if (filter !== 'all' && !d.meal_types.includes(filter)) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q)
        || d.cuisine_label.toLowerCase().includes(q)
        || d.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [dishes, filter, query]);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-sans font-semibold text-xl text-chef flex items-center gap-2">
          <ChefHat size={22} />
          Recipe Ideas
        </h2>
        <p className="text-sm text-chef-subtle mt-1">
          {dishes.length > 0
            ? `${dishes.length}+ recipes matched to your pantry${summary ? ` · ${summary}` : ''}`
            : 'Add pantry items to unlock personalized recipe ideas from our library.'}
        </p>
        <Link to="/meals" className="text-link !min-h-0 text-xs mt-2 inline-flex">← Meal Planner</Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEAL_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap min-h-[52px] capitalize ${
              filter === f ? 'bg-chef text-white' : 'bg-white border border-steel text-chef-subtle'
            }`}
          >
            {f === 'all' ? 'All meals' : f}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chef-subtle" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes or ingredients…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-steel min-h-[52px]"
        />
      </div>

      {loading && <div className="card text-chef-subtle text-sm">Loading recipe library…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-8 space-y-3 text-chef-subtle">
          <p>No matches yet.</p>
          <Link to="/wizard" className="btn-primary inline-flex">Stock your pantry</Link>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((d) => {
          const open = expanded === d.id;
          return (
            <article key={d.id} className="card space-y-2">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpanded(open ? null : d.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-chef">{d.title}</h3>
                    <p className="text-xs text-chef-subtle mt-0.5">
                      {d.cuisine_label} · {d.pantry_match}% pantry match
                    </p>
                  </div>
                  <span className="text-xs text-chef-subtle flex items-center gap-1 shrink-0">
                    <Clock size={14} />
                    {d.prep_time_minutes}m
                  </span>
                </div>
                {d.description && (
                  <p className="text-sm text-chef-subtle mt-2 line-clamp-2">{d.description}</p>
                )}
              </button>

              {open && (
                <div className="pt-2 border-t border-steel space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-chef mb-1">Ingredients</p>
                    <ul className="text-chef-subtle space-y-0.5">
                      {d.ingredients.map((i) => (
                        <li key={`${d.id}-${i.name}`}>
                          {d.ingredients_in_pantry.some((p) => p.toLowerCase() === i.name.toLowerCase()) ? '✓ ' : '○ '}
                          {i.quantity} {i.unit} {i.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {d.steps.length > 0 && (
                    <div>
                      <p className="font-medium text-chef mb-1">Steps</p>
                      <ol className="list-decimal list-inside text-chef-subtle space-y-1">
                        {d.steps.map((step) => (
                          <li key={step.slice(0, 40)}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {d.ingredients_missing.length > 0 && (
                    <p className="text-xs text-burgundy-600">
                      Shop: {d.ingredients_missing.slice(0, 5).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
