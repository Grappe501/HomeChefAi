import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, ShoppingBag, Package } from 'lucide-react';
import type { PlannedMeal } from '@/types';
import type { MealIntelligence } from '@/types/mealIntelligence';

interface MealWhyPanelProps {
  meal: PlannedMeal;
  intelligence?: MealIntelligence;
  loading?: boolean;
  onClose: () => void;
}

export function MealWhyPanel({ meal, intelligence, loading, onClose }: MealWhyPanelProps) {
  const [showSpecial, setShowSpecial] = useState(false);
  const intel = intelligence ?? meal.intelligence;

  if (loading) {
    return (
      <div className="rounded-lg border border-steel bg-stainless-100 p-4 space-y-2">
        <p className="font-semibold text-chef">Why this meal?</p>
        <p className="text-sm text-chef-subtle animate-pulse">Clara is analyzing your pantry and plan context…</p>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="rounded-lg border border-steel bg-stainless-100 p-4 space-y-2">
        <p className="font-semibold text-chef">Why this meal?</p>
        <p className="text-sm text-chef-subtle">{meal.description || 'Clara selected this for your plan coverage and pantry.'}</p>
        <button type="button" onClick={onClose} className="text-xs text-chef-muted underline">Close</button>
      </div>
    );
  }

  const { complexity, special_occasion: special } = intel;

  return (
    <div className="rounded-lg border border-chef-muted/30 bg-stainless-100 p-4 space-y-3 text-sm">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-chef-muted">{intel.recommendation_label}</p>
          <p className="font-semibold text-chef mt-0.5">{intel.headline}</p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-chef-subtle shrink-0">Close</button>
      </div>

      <Section title="Why Clara chose this">{intel.why_chosen}</Section>
      <Section title="Nutrition & plan fit">{intel.nutrition_fit}</Section>
      <Section title="Will your household like it?">{intel.likeability}</Section>
      <Section title="Pantry">{intel.inventory_story}</Section>

      {intel.substitutions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide mb-1">Smart substitutions</p>
          <ul className="space-y-1.5">
            {intel.substitutions.map((s, i) => (
              <li key={i} className="text-chef">
                <span className="text-chef-subtle">No {s.missing}?</span>{' '}
                Use <span className="font-medium">{s.swap}</span>
                {s.in_pantry && <span className="text-chef-muted text-xs ml-1">· in pantry</span>}
                {s.note && <span className="block text-xs text-chef-subtle mt-0.5">{s.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md bg-stainless-200 px-3 py-2 space-y-1">
        <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide flex items-center gap-1">
          <UtensilsCrossed size={12} /> Complexity
        </p>
        <p className="text-chef capitalize">{complexity.level} · {complexity.courses}-course · ~{complexity.prep_time_minutes} min prep</p>
        {complexity.wine_pairing_suggested && (
          <p className="text-xs text-chef-subtle flex items-start gap-1">
            <Wine size={12} className="mt-0.5 shrink-0" />
            {complexity.wine_note}
          </p>
        )}
      </div>

      {special.expandable && (
        <div className="border-t border-steel pt-2">
          <button
            type="button"
            onClick={() => setShowSpecial(!showSpecial)}
            className="flex items-center gap-1 text-xs font-semibold text-chef-muted w-full"
          >
            {showSpecial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {special.label ?? 'Make this special'} — menu & prep
          </button>
          {showSpecial && (
            <div className="mt-2 space-y-2 pl-1">
              {special.menu_prep_hints.length > 0 && (
                <HintList icon={<UtensilsCrossed size={12} />} title="Menu prep" items={special.menu_prep_hints} />
              )}
              {special.grocery_prep_hints.length > 0 && (
                <HintList icon={<ShoppingBag size={12} />} title="Grocery prep" items={special.grocery_prep_hints} />
              )}
              {special.inventory_prep_hints.length > 0 && (
                <HintList icon={<Package size={12} />} title="Inventory prep" items={special.inventory_prep_hints} />
              )}
            </div>
          )}
        </div>
      )}

      {intel.evidence.length > 0 && (
        <p className="text-xs text-chef-subtle">
          Knowledge: {intel.evidence.slice(0, 3).join(', ')}
          {intel.evidence.length > 3 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide mb-0.5">{title}</p>
      <p className="text-chef">{children}</p>
    </div>
  );
}

function HintList({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-chef-subtle flex items-center gap-1 mb-0.5">{icon} {title}</p>
      <ul className="list-disc list-inside text-xs text-chef space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
