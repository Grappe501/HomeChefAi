import { Lightbulb } from 'lucide-react';
import type { TechniqueCoachTip } from '@/types/journey';

interface Props {
  tips: TechniqueCoachTip[];
  className?: string;
}

export function CookTogetherCoach({ tips, className = '' }: Props) {
  if (!tips.length) return null;

  return (
    <div className={`rounded-xl border border-chef-muted/30 bg-stainless-100 p-4 space-y-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-chef-muted flex items-center gap-1">
        <Lightbulb size={14} /> Cook Together — Clara&apos;s tip
      </p>
      {tips.map((tip) => (
        <div key={tip.technique_id} className="space-y-0.5">
          <p className="text-sm font-semibold text-chef">{tip.technique_name}</p>
          <p className="text-sm text-chef-subtle leading-relaxed">{tip.micro_lesson}</p>
        </div>
      ))}
    </div>
  );
}
