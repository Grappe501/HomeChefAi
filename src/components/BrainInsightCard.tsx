import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BrainInsight } from '@/types/brain';

interface Props {
  insight: BrainInsight;
  defaultExpanded?: boolean;
}

export default function BrainInsightCard({ insight, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const confidencePct = Math.round(insight.confidence * 100);
  const evidence = insight.metadata?.evidence_lines ?? [];

  return (
    <article className="card-elevated">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <p className="text-sm text-chef-subtle leading-relaxed">{insight.insight}</p>
        {insight.action_prompt && (
          <p className="text-sm text-chef mt-2 font-medium">{insight.action_prompt}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-chef-subtle">Confidence: {confidencePct}%</span>
          <span className="text-xs text-chef-muted flex items-center gap-0.5">
            {expanded ? 'Hide evidence' : 'Why we know this'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>

      {expanded && evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-steel">
          <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide mb-2">Based on</p>
          <ul className="space-y-1">
            {evidence.map((line, i) => (
              <li key={i} className="text-sm text-chef-subtle flex items-start gap-2">
                <span className="text-chef mt-0.5">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
