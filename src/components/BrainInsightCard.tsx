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
    <article className="card border-l-4 border-chef-400">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <p className="text-sm text-sage-700 leading-relaxed">{insight.insight}</p>
        {insight.action_prompt && (
          <p className="text-sm text-chef-700 mt-2 font-medium">{insight.action_prompt}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-sage-500">Confidence: {confidencePct}%</span>
          <span className="text-xs text-chef-600 flex items-center gap-0.5">
            {expanded ? 'Hide evidence' : 'Why we know this'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>

      {expanded && evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-sage-100">
          <p className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-2">Based on</p>
          <ul className="space-y-1">
            {evidence.map((line, i) => (
              <li key={i} className="text-sm text-sage-700 flex items-start gap-2">
                <span className="text-chef-500 mt-0.5">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
