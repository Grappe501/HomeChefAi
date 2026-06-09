import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/api';
import { DIETARY_OPTIONS, CUISINE_OPTIONS } from '@/types';
import { speak } from '@/lib/utils';
import { COOKS_WITH_OPTIONS, COOKING_SELF_ASSESSMENT, ONBOARDING_PRIORITIES, LOCAL_FOOD_OPTIONS } from '@/types/platform';
import type { CulinaryProfile, FoodPriority, LocalFoodPreference } from '@/types/platform';

interface OnboardingProps {
  mode: 'dietary';
}

interface Step {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

export default function Onboarding(_props: OnboardingProps) {
  const { updateProfile } = useApp();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [household, setHousehold] = useState(2);
  const [allergies, setAllergies] = useState('');
  const [zip, setZip] = useState('');
  const [cooksWith, setCooksWith] = useState<string[]>([]);
  const [cookingAssessment, setCookingAssessment] = useState('');
  const [kitchenName, setKitchenName] = useState('');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [localFood, setLocalFood] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (arr: string[], item: string, setter: (v: string[]) => void) => {
    if (item === 'None' && arr.includes('None')) return;
    if (item === 'None') { setter(['None']); return; }
    const next = arr.filter((x) => x !== 'None');
    setter(next.includes(item) ? next.filter((x) => x !== item) : [...next, item]);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const culinaryProfile: CulinaryProfile = {
        cooks_with: cooksWith as CulinaryProfile['cooks_with'],
        cooking_self_assessment: cookingAssessment || undefined,
        priorities: priorities as FoodPriority[],
        local_food: localFood as LocalFoodPreference[],
      };
      await updateProfile({
        dietary_restrictions: dietary.length ? dietary : [],
        cuisine_preferences: cuisines.length ? cuisines : [],
        allergies: allergies ? allergies.split(',').map((a) => a.trim()).filter(Boolean) : [],
        household_size: household,
        zip_code: zip || undefined,
        household_display_name: kitchenName || undefined,
        culinary_profile: culinaryProfile,
        food_priorities: priorities.length ? priorities : [],
        onboarding_complete: true,
      } as never);
      const localHint = localFood.length > 0 ? ' We will help you buy and grow local when it fits.' : '';
      speak(`Perfect! Your kitchen is ready.${localHint} Invite family from Settings to cook together.`);
      toast.success('Your kitchen is ready, Chef.');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = [
    {
      title: 'Dietary needs',
      subtitle: 'Help your Sous Chef respect how you eat.',
      content: (
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggle(dietary, d, setDietary)}
              className={`tap-item ${dietary.includes(d) ? 'tap-item-selected' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Favorite cuisines',
      subtitle: 'What flavors does your kitchen gravitate toward?',
      content: (
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggle(cuisines, c, setCuisines)}
              className={`tap-item ${cuisines.includes(c) ? 'tap-item-selected' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your priorities',
      subtitle: 'Pick what matters most — SousChef will tailor recommendations.',
      content: (
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_PRIORITIES.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => toggle(priorities, id, setPriorities)}
              className={`tap-item ${priorities.includes(id) ? 'tap-item-selected' : ''}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Local food',
      subtitle: 'Farmers markets, home gardens, seasonal produce — optional.',
      content: (
        <div className="flex flex-wrap gap-2">
          {LOCAL_FOOD_OPTIONS.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => toggle(localFood, id, setLocalFood)}
              className={`tap-item ${localFood.includes(id) ? 'tap-item-selected' : ''}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Household size',
      subtitle: 'How many people does this kitchen feed?',
      content: (
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setHousehold(n)}
              className={`tap-item w-14 h-14 ${household === n ? 'tap-item-selected' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Who you cook with',
      subtitle: 'SousChef works best when families cook together.',
      content: (
        <div className="flex flex-wrap gap-2">
          {COOKS_WITH_OPTIONS.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => toggle(cooksWith, id, setCooksWith)}
              className={`tap-item ${cooksWith.includes(id) ? 'tap-item-selected' : ''}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your cooking level',
      subtitle: 'Which sounds most like you? We will help you grow from here.',
      content: (
        <div className="space-y-3">
          {COOKING_SELF_ASSESSMENT.map((option) => (
            <button
              key={option}
              onClick={() => setCookingAssessment(option)}
              className={`tap-item w-full text-left ${cookingAssessment === option ? 'tap-item-selected' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Name your kitchen',
      subtitle: 'Family and friends can join this kitchen later. Optional.',
      content: (
        <input
          type="text"
          value={kitchenName}
          onChange={(e) => setKitchenName(e.target.value)}
          placeholder="The Grappe Family Kitchen"
          className="input-field"
        />
      ),
    },
    {
      title: 'Zip code',
      subtitle: 'For local grocery estimates and neighbor swap. Optional.',
      content: (
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="72701"
          className="input-field"
          maxLength={5}
        />
      ),
    },
    {
      title: 'Allergies',
      subtitle: 'Help your Sous Chef avoid ingredients that do not belong in your kitchen.',
      content: (
        <input
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g. peanuts, shellfish"
          className="input-field"
        />
      ),
    },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 bg-stainless-100 max-w-content mx-auto w-full">
      <p className="text-xs font-medium text-copper-600 uppercase tracking-wider mb-6">SousChef · Beta</p>

      <div className="mb-8">
        <div className="h-0.5 w-full rounded-full bg-steel overflow-hidden">
          <div
            className="h-full bg-copper-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-chef-subtle mt-2 tabular-nums">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="step-title">{steps[step].title}</h2>
        {steps[step].subtitle && (
          <p className="step-subtitle mt-2">{steps[step].subtitle}</p>
        )}
      </div>

      <div className="flex-1">{steps[step].content}</div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1">Back</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="btn-primary flex-1">Continue</button>
        ) : (
          <button onClick={handleComplete} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Start Cooking'}
          </button>
        )}
      </div>
    </div>
  );
}
