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
};

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
        <Link
          key={p.id}
          to={p.clara_prompt ? `/assistant?q=${encodeURIComponent(p.clara_prompt)}` : '/assistant'}
          className="card block hover:border-copper-300/60 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-copper-700">
                {TYPE_LABELS[p.type]}
              </p>
              <p className="font-semibold text-chef mt-0.5">{p.title}</p>
              <p className="text-sm text-chef-subtle mt-1 leading-relaxed line-clamp-2">{p.message}</p>
              {p.meals && p.meals.length > 0 && (
                <p className="text-xs text-chef-muted mt-2 truncate">
                  {p.meals.slice(0, 3).join(' · ')}
                </p>
              )}
            </div>
            <ChevronRight
              size={18}
              className="text-chef-subtle shrink-0 mt-1 group-hover:text-copper-600 transition-colors"
            />
          </div>
        </Link>
      ))}
    </section>
  );
}
