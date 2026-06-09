import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, ShoppingBag, Package, BookOpen, GraduationCap, Clock } from 'lucide-react';
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
  const [showDeep, setShowDeep] = useState(true);
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

      {(intel.dish_context || (intel.deep_dives && intel.deep_dives.length > 0)) && (
        <div className="border-t border-steel pt-2">
          <button
            type="button"
            onClick={() => setShowDeep(!showDeep)}
            className="flex items-center gap-1 text-xs font-semibold text-chef-muted w-full"
          >
            {showDeep ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <BookOpen size={14} /> History & origins
          </button>
          {showDeep && (
            <div className="mt-2 space-y-3 pl-1">
              {intel.dish_context && (
                <div className="rounded-md bg-stainless-200/80 px-3 py-2 space-y-1">
                  <p className="text-xs font-semibold text-chef-subtle">{intel.dish_context.title}</p>
                  {intel.dish_context.approximate_age && (
                    <p className="text-[11px] text-chef-muted flex items-center gap-1">
                      <Clock size={11} /> Around for {intel.dish_context.approximate_age}
                    </p>
                  )}
                  <p className="text-xs text-chef leading-relaxed">{intel.dish_context.origins_summary}</p>
                  {intel.dish_context.history && (
                    <p className="text-xs text-chef-subtle leading-relaxed">{intel.dish_context.history}</p>
                  )}
                </div>
              )}
              {intel.deep_dives?.map((dive, i) => (
                <div key={i} className="rounded-md border border-steel/60 px-3 py-2 space-y-1">
                  <p className="text-xs font-semibold text-chef">{dive.title}</p>
                  {dive.first_known && (
                    <p className="text-[11px] text-chef-muted">Known ~{dive.first_known}</p>
                  )}
                  {dive.origins && <p className="text-xs text-chef-subtle">{dive.origins}</p>}
                  {dive.teaching?.[0] && (
                    <p className="text-[11px] text-copper-700 italic">{dive.teaching[0]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {intel.teaching_moments && intel.teaching_moments.length > 0 && (
        <div className="rounded-md bg-copper-50/60 border border-copper-200/60 px-3 py-2">
          <p className="text-xs font-semibold text-copper-800 uppercase tracking-wide flex items-center gap-1 mb-1">
            <GraduationCap size={12} /> Teach me
          </p>
          <ul className="space-y-1">
            {intel.teaching_moments.map((tip, i) => (
              <li key={i} className="text-xs text-chef">{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {intel.evidence.length > 0 && (
        <p className="text-xs text-chef-subtle">
          Knowledge: {intel.evidence.slice(0, 3).join(', ')}
          {intel.evidence.length > 3 ? '…' : ''}
        </p>
      )}

      {intel.ingredient_trivia && (
        <p className="text-[11px] leading-snug text-chef-subtle/80 italic border-t border-steel/60 pt-2 mt-1">
          {intel.ingredient_trivia}
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
