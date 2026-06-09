import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { usageApi, assistantApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { VoiceInput } from '@/components/VoiceButton';

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
}

export default function CookLog() {
  const { refreshProfile } = useApp();
  const toast = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedItem[] | null>(null);
  const [mealName, setMealName] = useState('');
  const [shareRecipe, setShareRecipe] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [shared, setShared] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await assistantApi.chat(input);
      setMealName(input);
      if (result.suggested_items?.length) {
        setSuggested(result.suggested_items);
        speak(result.reply);
      } else {
        speak(result.reply);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze meal');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!suggested) return;
    setLoading(true);
    try {
      const result = await usageApi.log({
        meal_name: mealName,
        description: mealName,
        items_used: suggested,
        share_recipe: shareRecipe,
        recipe_public: true,
      });
      await refreshProfile();
      const xp = (result as { xp_gained?: number }).xp_gained ?? 25;
      toast.success(`Pantry updated · +${xp} XP`);
      speak('Got it! Inventory updated.');
      setShared(!!result.recipe);
      setConfirmed(true);
      setTimeout(() => {
        setInput('');
        setSuggested(null);
        setMealName('');
        setConfirmed(false);
        setShared(false);
      }, 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update pantry');
    } finally {
      setLoading(false);
    }
  };

  const adjustItem = (idx: number, delta: number) => {
    if (!suggested) return;
    const next = [...suggested];
    next[idx] = { ...next[idx], quantity: Math.max(0, next[idx].quantity + delta) };
    setSuggested(next);
  };

  const quickMeals = ['Grilled cheese', 'Scrambled eggs', 'Pasta with sauce', 'PB&J sandwich', 'Salad'];

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl text-chef-800">Log a Meal</h2>
      <p className="text-sage-600 text-sm">Tell me what you cooked — I'll update your pantry and optionally share the recipe.</p>

      {confirmed ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-semibold text-chef-700">Inventory Updated!</p>
          {shared && <p className="text-sm text-sage-600 mt-2 flex items-center justify-center gap-1"><Share2 size={16} /> Recipe shared with community</p>}
        </div>
      ) : suggested ? (
        <div className="space-y-4">
          <div className="card bg-chef-50">
            <p className="font-medium">{mealName}</p>
            <p className="text-sm text-sage-600 mt-1">Did you use these ingredients?</p>
          </div>
          {suggested.map((item, idx) => (
            <div key={idx} className="card flex items-center justify-between gap-3 py-4">
              <span className="font-medium flex-1">{item.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustItem(idx, -1)} className="btn-icon bg-sage-100 font-bold text-lg">−</button>
                <span className="w-20 text-center font-semibold text-sm">{item.quantity} {item.unit}</span>
                <button onClick={() => adjustItem(idx, 1)} className="btn-icon bg-sage-100 font-bold text-lg">+</button>
              </div>
            </div>
          ))}
          <label className="flex items-center gap-3 text-sm text-sage-700 min-h-[52px] py-2">
            <input type="checkbox" checked={shareRecipe} onChange={(e) => setShareRecipe(e.target.checked)} className="w-5 h-5 rounded" />
            Share this meal as a community recipe
          </label>
          <div className="flex flex-col gap-3">
            <button onClick={handleConfirm} disabled={loading} className="btn-primary w-full min-h-[52px]">
              <Check size={20} /> Yes, Update Pantry
            </button>
            <button onClick={() => setSuggested(null)} className="btn-secondary w-full min-h-[52px]">
              No, Edit
            </button>
          </div>
        </div>
      ) : (
        <>
          <VoiceInput value={input} onChange={setInput} placeholder="I made grilled cheese..." onSubmit={handleSubmit} />
          <button onClick={handleSubmit} disabled={loading || !input.trim()} className="btn-primary w-full min-h-[52px]">
            {loading ? 'Thinking...' : 'Log Meal'}
          </button>
          <div>
            <p className="text-xs text-sage-500 mb-3">Quick tap:</p>
            <div className="flex flex-wrap gap-3">
              {quickMeals.map((m) => (
                <button key={m} onClick={() => setInput(m)} className="tap-item text-sm">{m}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
