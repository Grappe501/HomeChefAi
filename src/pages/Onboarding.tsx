import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { DIETARY_OPTIONS, CUISINE_OPTIONS } from '@/types';
import { speak } from '@/lib/utils';

interface OnboardingProps {
  mode: 'welcome' | 'dietary';
}

export default function Onboarding({ mode }: OnboardingProps) {
  const { initAuth, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [household, setHousehold] = useState(2);
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (arr: string[], item: string, setter: (v: string[]) => void) => {
    if (item === 'None' && arr.includes('None')) return;
    if (item === 'None') { setter(['None']); return; }
    const next = arr.filter((x) => x !== 'None');
    setter(next.includes(item) ? next.filter((x) => x !== item) : [...next, item]);
  };

  const handleWelcome = async () => {
    setLoading(true);
    await initAuth(name || 'Chef');
    speak(`Nice to meet you${name ? `, ${name}` : ''}! I'm your Sous Chef. Let's set up your kitchen.`);
    setLoading(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    await updateProfile({
      dietary_restrictions: dietary,
      cuisine_preferences: cuisines,
      allergies: allergies ? allergies.split(',').map((a) => a.trim()) : [],
      household_size: household,
      onboarding_complete: true,
    });
    speak("Perfect! Your kitchen is ready. Scan a receipt or tap through the pantry wizard to get started.");
    setLoading(false);
  };

  if (mode === 'welcome') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-chef-50 via-white to-sage-50">
        <div className="text-7xl mb-6">👨‍🍳</div>
        <h1 className="font-display text-3xl text-chef-800 text-center mb-2">Meet Your Sous Chef</h1>
        <p className="text-sage-600 text-center mb-8 max-w-sm">
          I'm your personal kitchen assistant. I'll track your pantry, scan receipts, plan meals, and help you cook — all by voice or tap.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should I call you?"
          className="input-field max-w-sm mb-4"
        />
        <button onClick={handleWelcome} disabled={loading} className="btn-primary w-full max-w-sm">
          {loading ? 'Setting up...' : "Let's Go"}
        </button>
      </div>
    );
  }

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
