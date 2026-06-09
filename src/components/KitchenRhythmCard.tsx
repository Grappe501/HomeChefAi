import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight } from 'lucide-react';
import type { BehaviorProfile, KitchenRhythmNudge } from '@/types/behaviorLearning';

interface Props {
  profile?: BehaviorProfile | null;
  nudges: KitchenRhythmNudge[];
  loading?: boolean;
}

function rhythmSummary(profile: BehaviorProfile): string[] {
  const lines: string[] = [];
  if (profile.cook_nights.length) {
    lines.push(`Cook nights: ${profile.cook_nights.map((c) => c.day_name).join(', ')}`);
  }
  if (profile.shop_day) {
    lines.push(`Usually shops ${profile.shop_day.day_name}s`);
  }
  if (profile.budget_band) {
    lines.push(`~$${profile.budget_band.weekly_avg}/week groceries`);
  }
  lines.push(`${profile.time_budget.weeknight_max_minutes}-min weeknight target`);
  return lines.slice(0, 3);
}

export default function KitchenRhythmCard({ profile, nudges, loading }: Props) {
  if (loading) {
    return (
      <div className="card text-sm text-chef-subtle min-h-[52px] flex items-center">
        Learning your kitchen rhythm…
      </div>
    );
  }

  const hasProfile =
    profile &&
    (profile.cook_nights.length > 0 ||
      profile.shop_day ||
      profile.budget_band ||
      profile.leftover_style !== 'unknown');

  if (!hasProfile && !nudges.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-copper-600" />
        <p className="section-label">Kitchen rhythm</p>
      </div>

      {nudges.map((nudge) => (
        <div key={nudge.id} className="card border-copper-200/80 bg-copper-50/20">
          <p className="font-semibold text-chef">{nudge.title}</p>
          <p className="text-sm text-chef-subtle mt-1 leading-relaxed">{nudge.message}</p>
          {nudge.clara_prompt && (
            <Link
              to={`/assistant?q=${encodeURIComponent(nudge.clara_prompt)}`}
              className="inline-flex items-center gap-1 text-link text-sm mt-3 min-h-[44px]"
            >
              Ask Clara <ChevronRight size={14} />
            </Link>
          )}
        </div>
      ))}

      {hasProfile && profile && (
        <div className="card">
          <ul className="space-y-2">
            {rhythmSummary(profile).map((line) => (
              <li key={line} className="text-sm text-chef flex items-start gap-2">
                <span className="text-chef-subtle shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
          {profile.leftover_style === 'batch_cooker' && (
            <p className="text-xs text-chef-subtle mt-3">Batch-cook friendly — plans ahead with leftovers.</p>
          )}
        </div>
      )}
    </section>
  );
}
