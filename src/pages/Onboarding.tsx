import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { DIETARY_OPTIONS, CUISINE_OPTIONS } from '@/types';
import { speak } from '@/lib/utils';
import { COOKS_WITH_OPTIONS, COOKING_SELF_ASSESSMENT, ONBOARDING_PRIORITIES, LOCAL_FOOD_OPTIONS } from '@/types/platform';
import type { CulinaryProfile, FoodPriority, LocalFoodPreference } from '@/types/platform';

interface OnboardingProps {
  mode: 'dietary';
}

export default function Onboarding(_props: OnboardingProps) {
  const { updateProfile } = useApp();
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
    const culinaryProfile: CulinaryProfile = {
      cooks_with: cooksWith as CulinaryProfile['cooks_with'],
      cooking_self_assessment: cookingAssessment || undefined,
      priorities: priorities as FoodPriority[],
      local_food: localFood as LocalFoodPreference[],
    };
    await updateProfile({
      dietary_restrictions: dietary,
      cuisine_preferences: cuisines,
      allergies: allergies ? allergies.split(',').map((a) => a.trim()) : [],
      household_size: household,
      zip_code: zip || undefined,
      household_display_name: kitchenName || undefined,
      culinary_profile: culinaryProfile,
      food_priorities: priorities,
      onboarding_complete: true,
    } as never);
    const localHint = localFood.length > 0 ? ' We will help you buy and grow local when it fits.' : '';
    speak(`Perfect! Your kitchen is ready.${localHint} Invite family from Settings to cook together.`);
    setLoading(false);
  };

  const steps = [
    {
      title: 'Any dietary needs?',
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
      title: 'Favorite cuisines?',
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
      title: 'Why are you here?',
      content: (
        <div>
          <p className="text-sm text-sage-600 mb-3">Pick your top priorities — SousChef will tailor recommendations.</p>
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
        </div>
      ),
    },
    {
      title: 'Buy & grow local?',
      content: (
        <div>
          <p className="text-sm text-sage-600 mb-3">We will gently encourage local food when it fits — farmers markets, home gardens, seasonal produce. Optional.</p>
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
        </div>
      ),
    },
    {
      title: 'Household size?',
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
      title: 'Who do you cook with?',
      content: (
        <div>
          <p className="text-sm text-sage-600 mb-3">SousChef works best when families cook together. Tap all that apply.</p>
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
        </div>
      ),
    },
    {
      title: 'Tell us about your cooking',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-sage-600">Which sounds most like you? We'll help you grow from here.</p>
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
      title: 'Name your kitchen (optional)',
      content: (
        <div>
          <p className="text-sm text-sage-600 mb-3">Family and friends can join this kitchen later.</p>
          <input
            type="text"
            value={kitchenName}
            onChange={(e) => setKitchenName(e.target.value)}
            placeholder="The Grappe Family Kitchen"
            className="input-field"
          />
        </div>
      ),
    },
    {
      title: 'Your zip code?',
      content: (
        <div>
          <p className="text-sm text-sage-600 mb-3">For local grocery estimates and neighbor swap — optional.</p>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="72701"
            className="input-field"
            maxLength={5}
          />
        </div>
      ),
    },
    {
      title: 'Any allergies? (optional)',
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

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 bg-gradient-to-b from-chef-50 to-white">
      <p className="text-sm text-chef-600 font-medium mb-2">Welcome — full access during beta</p>
      <div className="flex gap-1 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-chef-500' : 'bg-sage-200'}`} />
        ))}
      </div>
      <h2 className="font-display text-2xl text-chef-800 mb-6">{steps[step].title}</h2>
      <div className="flex-1">{steps[step].content}</div>
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1">Back</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="btn-primary flex-1">Next</button>
        ) : (
          <button onClick={handleComplete} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Start Cooking'}
          </button>
        )}
      </div>
    </div>
  );
}
