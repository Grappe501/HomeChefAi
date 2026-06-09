import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { KitchenPrediction } from '@/types/kitchenPredictions';

const TYPE_LABELS: Record<KitchenPrediction['type'], string> = {
  likely_meals: 'This week',
  use_before_waste: 'Use soon',
  kitchen_identity: 'Kitchen style',
  ledger_avoid: 'Your feedback',
  buy_never_use: 'Pantry challenge',
  cook_night: 'Cook night',
  emerging_tradition: 'Tradition',
  kitchen_staple: 'Staples',
};

function directionPrompt(d: NonNullable<KitchenPrediction['directions']>[number]): string {
  if (d.dish_id) return `recipe:${d.dish_id}`;
  return `Build a plan around the ${d.cuisine_label} direction: ${d.title}`;
}

interface Props {
  predictions: KitchenPrediction[];
  loading?: boolean;
}

export default function ProactiveKitchenCards({ predictions, loading }: Props) {
  if (loading) {
    return (
      <div className="card text-sm text-chef-subtle min-h-[52px] flex items-center">
        Clara is reading your kitchen patterns…
      </div>
    );
  }

  if (!predictions.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-copper-600" />
        <p className="section-label">Clara&apos;s proactive read</p>
      </div>
      {predictions.slice(0, 4).map((p) => (
        <div key={p.id} className="card hover:border-copper-300/60 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-copper-700">
                {TYPE_LABELS[p.type]}
              </p>
              <p className="font-semibold text-chef mt-0.5">{p.title}</p>
              <p className="text-sm text-chef-subtle mt-1 leading-relaxed">{p.message}</p>
              {p.directions && p.directions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {p.directions.slice(0, 3).map((d) => (
                    <Link
                      key={d.id}
                      to={`/assistant?q=${encodeURIComponent(directionPrompt(d))}`}
                      className="block rounded-lg border border-steel bg-stainless-50 px-3 py-2 hover:border-chef/40 transition-colors"
                    >
                      <p className="text-xs font-semibold text-chef">{d.cuisine_label}</p>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-chef-subtle mt-0.5 line-clamp-1">{d.tagline}</p>
                    </Link>
                  ))}
                </div>
              )}
              {(!p.directions || p.directions.length === 0) && p.meals && p.meals.length > 0 && (
                <p className="text-xs text-chef-muted mt-2 truncate">
                  {p.meals.slice(0, 3).join(' · ')}
                </p>
              )}
              {p.clara_prompt && (
                <Link
                  to={`/assistant?q=${encodeURIComponent(p.clara_prompt)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-copper-700 mt-3 hover:text-copper-800"
                >
                  Ask Clara
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
