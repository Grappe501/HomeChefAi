import { Check, X } from 'lucide-react';
import type { MealOutcomeRating, PendingPreference } from '@/types/tasteLearning';
import { MEAL_OUTCOME_OPTIONS } from '@/types/tasteLearning';

const KIND_LABELS: Record<PendingPreference['kind'], string> = {
  avoid: 'Avoid',
  prefer: 'Prefer',
  allergy: 'Allergy',
  household: 'Household note',
};

interface PreferenceConfirmCardProps {
  preference: PendingPreference;
  saving?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function PreferenceConfirmCard({
  preference,
  saving,
  onConfirm,
  onDismiss,
}: PreferenceConfirmCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-copper-200 bg-copper-50/80 px-3 py-3 space-y-2">
      <p className="text-xs font-semibold text-copper-800 uppercase tracking-wide">Remember for your kitchen?</p>
      <p className="text-sm text-chef">
        <span className="font-medium">{KIND_LABELS[preference.kind]}:</span> {preference.subject}
        {preference.member_label ? ` (${preference.member_label})` : ''}
      </p>
      {preference.reason && (
        <p className="text-xs text-chef-subtle">{preference.reason}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="btn-primary flex-1 min-h-[44px] text-sm"
        >
          <Check size={16} /> {saving ? 'Saving…' : 'Save preference'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={saving}
          className="btn-secondary min-h-[44px] px-4"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

interface MealOutcomePickerProps {
  mealName: string;
  saving?: boolean;
  onRate: (rating: MealOutcomeRating) => void;
  onSkip: () => void;
}

export function MealOutcomePicker({ mealName, saving, onRate, onSkip }: MealOutcomePickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-chef-subtle text-center">
        How was <span className="font-medium text-chef">{mealName}</span>?
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {MEAL_OUTCOME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={saving}
            onClick={() => onRate(opt.id)}
            className="tap-item text-sm min-h-[44px] px-3"
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={onSkip} className="text-xs text-chef-subtle w-full text-center py-2">
        Skip for now
      </button>
    </div>
  );
}
