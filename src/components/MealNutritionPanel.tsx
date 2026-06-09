import { useState } from 'react';
import { ChevronDown, ChevronUp, Scale } from 'lucide-react';
import type { MealNutritionEstimate } from '@/types/mealNutrition';

interface MealNutritionPanelProps {
  nutrition: MealNutritionEstimate;
  /** Compact one-liner on meal card — tap to expand full drill-down */
  compact?: boolean;
}

export function MealNutritionPanel({ nutrition, compact }: MealNutritionPanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  const p = nutrition.per_serving;

  if (compact && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-[10px] text-chef-subtle hover:text-chef flex items-center gap-1 mt-1.5 min-h-[32px]"
      >
        <Scale size={10} aria-hidden />
        ~{p.calories} cal/serving · {p.protein_g}g protein · tap for breakdown
        <ChevronDown size={10} />
      </button>
    );
  }

  return (
    <div className={`rounded-md border border-sage-200/80 bg-sage-50/50 px-3 py-2 space-y-2 ${compact ? 'mt-1.5' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded(compact ? false : !expanded)}
        className="flex items-center justify-between w-full text-xs font-semibold text-chef-subtle uppercase tracking-wide min-h-[32px]"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1">
          <Scale size={12} aria-hidden /> Nutrition estimate
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {(expanded || !compact) && (
        <>
          <MacroRow label="Per serving" macros={p} servings={nutrition.servings} />

          <div className="border-t border-sage-200/60 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chef-subtle mb-2">
              By ingredient
            </p>
            <ul className="space-y-2">
              {nutrition.ingredients.map((ing, i) => (
                <li key={i} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-chef truncate">{ing.ingredient_name}</span>
                    <span className="text-chef-subtle shrink-0 tabular-nums">{ing.calories} cal</span>
                  </div>
                  <p className="text-[10px] text-chef-muted mt-0.5">
                    {ing.portion_label}
                    {ing.estimated_portion && ' · portion estimated'}
                    {' · '}
                    P {ing.protein_g}g · C {ing.carbs_g}g · F {ing.fat_g}g
                    {ing.fiber_g != null && ing.fiber_g > 0 && ` · Fiber ${ing.fiber_g}g`}
                    {ing.sodium_mg != null && ing.sodium_mg > 50 && ` · Na ${ing.sodium_mg}mg`}
                  </p>
                  {ing.reference_serving && (
                    <p className="text-[10px] text-chef-subtle/70 italic">Ref: {ing.reference_serving}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {nutrition.unknown_ingredients.length > 0 && (
            <p className="text-[10px] text-chef-subtle">
              No reference data for: {nutrition.unknown_ingredients.join(', ')}
            </p>
          )}

          <p className="text-[10px] text-chef-subtle/80 italic">{nutrition.disclaimer}</p>
        </>
      )}
    </div>
  );
}

function MacroRow({
  label,
  macros,
  servings,
}: {
  label: string;
  macros: MealNutritionEstimate['per_serving'];
  servings: number;
}) {
  return (
    <div className="text-xs text-chef">
      <p className="font-medium">{label}{servings > 1 ? ` (${servings} people)` : ''}</p>
      <p className="text-chef-subtle mt-0.5 tabular-nums">
        {macros.calories} cal · {macros.protein_g}g protein · {macros.carbs_g}g carbs · {macros.fat_g}g fat
        {macros.fiber_g != null && macros.fiber_g > 0 && ` · ${macros.fiber_g}g fiber`}
        {macros.sodium_mg != null && macros.sodium_mg > 100 && ` · ${macros.sodium_mg}mg sodium`}
      </p>
    </div>
  );
}
