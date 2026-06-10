import { Link } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';
import type { SkillGrowthNudge, SkillProfile } from '@/types/skillLearning';

interface Props {
  profile?: SkillProfile | null;
  nudges: SkillGrowthNudge[];
  loading?: boolean;
}

function skillSummary(profile: SkillProfile): string[] {
  const lines: string[] = [];
  if (profile.strong_techniques.length) {
    lines.push(
      `Strong: ${profile.strong_techniques
        .slice(0, 3)
        .map((t) => `${t.technique_name} (${t.comfort_level})`)
        .join(', ')}`,
    );
  }
  if (profile.building_techniques.length) {
    lines.push(`Building: ${profile.building_techniques.map((t) => t.technique_name).join(', ')}`);
  }
  if (profile.milestones.length) {
    lines.push(`${profile.milestones.length} milestone${profile.milestones.length !== 1 ? 's' : ''} unlocked`);
  }
  lines.push(`Overall: ${profile.overall_confidence}`);
  return lines.slice(0, 3);
}

export default function SkillGrowthCard({ profile, nudges, loading }: Props) {
  if (loading) {
    return (
      <div className="card text-sm text-chef-subtle min-h-[52px] flex items-center">
        Tracking your kitchen skills…
      </div>
    );
  }

  const hasProfile =
    profile &&
    (profile.techniques_practiced > 0 ||
      profile.stretch_techniques.length > 0 ||
      profile.milestones.length > 0);

  if (!hasProfile && !nudges.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-copper-600" />
          <p className="section-label">Skill growth</p>
        </div>
        <Link to="/learn" className="text-link !min-h-0 text-xs">
          Academy
        </Link>
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
            {skillSummary(profile).map((line) => (
              <li key={line} className="text-sm text-chef flex items-start gap-2">
                <span className="text-chef-subtle shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
          {profile.next_focus && (
            <p className="text-xs text-chef-subtle mt-3">{profile.next_focus.message}</p>
          )}
        </div>
      )}
    </section>
  );
}
