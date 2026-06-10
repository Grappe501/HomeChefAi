import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import type { IdentityNudge, IdentityProfile } from '@/types/identityLearning';

interface Props {
  profile?: IdentityProfile | null;
  nudges: IdentityNudge[];
  loading?: boolean;
}

function identitySummary(profile: IdentityProfile): string[] {
  const lines: string[] = [profile.archetype_label];
  if (profile.taste_signals.length) {
    lines.push(profile.taste_signals.slice(0, 2).join(' · '));
  }
  if (profile.cooks_with.length) {
    lines.push(`Cooks with ${profile.cooks_with.join(', ')}`);
  }
  return lines.slice(0, 3);
}

export default function HouseholdIdentityCard({ profile, nudges, loading }: Props) {
  if (loading) {
    return (
      <div className="card text-sm text-chef-subtle min-h-[52px] flex items-center">
        Learning your kitchen identity…
      </div>
    );
  }

  const hasProfile =
    profile &&
    (profile.primary_style ||
      profile.identity_traits.length > 0 ||
      profile.food_priorities.length > 0);

  if (!hasProfile && !nudges.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Home size={16} className="text-copper-600" />
        <p className="section-label">Kitchen identity</p>
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
            {identitySummary(profile).map((line) => (
              <li key={line} className="text-sm text-chef flex items-start gap-2">
                <span className="text-chef-subtle shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
          {profile.food_priorities.length > 0 && (
            <p className="text-xs text-chef-subtle mt-3">
              Priorities: {profile.food_priorities.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
