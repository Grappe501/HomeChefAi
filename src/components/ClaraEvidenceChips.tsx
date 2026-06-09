/** Evidence chips shown under Clara replies — Brain 3.0 */

interface ClaraEvidenceChipsProps {
  evidence?: string[];
  expertIds?: string[];
  intent?: string;
  creditCost?: number;
  creditsRemaining?: number;
}

const INTENT_LABEL: Record<string, string> = {
  substitution: 'Substitution',
  suggestion: 'Three directions',
  hosting: 'Hosting',
  meal_plan: 'Meal plan',
  chat: 'Chat',
  skill: 'Skill',
};

export function ClaraEvidenceChips({
  evidence = [],
  expertIds = [],
  intent,
  creditCost,
  creditsRemaining,
}: ClaraEvidenceChipsProps) {
  if (!evidence.length && !intent && creditCost === undefined) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {intent && (
        <span className="rounded-full bg-copper-500/10 text-copper-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {INTENT_LABEL[intent] ?? intent}
        </span>
      )}
      {creditCost !== undefined && (
        <span className="rounded-full bg-stainless-200 text-chef-subtle px-2 py-0.5 text-[10px]">
          {creditCost === 0 ? '0 credits' : `${creditCost} credit${creditCost === 1 ? '' : 's'}`}
          {creditsRemaining !== undefined ? ` · ${creditsRemaining} left` : ''}
        </span>
      )}
      {evidence.slice(0, 4).map((e) => (
        <span
          key={e}
          className="rounded-full border border-steel/80 bg-stainless-50 text-chef-subtle px-2 py-0.5 text-[10px] truncate max-w-[140px]"
          title={e}
        >
          {e.replace(/^(node|sub|kept|replaced|expiring|query|memory):/, '')}
        </span>
      ))}
      {expertIds.length > 0 && (
        <span className="rounded-full bg-sage-500/10 text-sage-800 px-2 py-0.5 text-[10px]" title={expertIds.join(', ')}>
          {expertIds.length} expert{expertIds.length === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
