import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { usageApi, assistantApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { VoiceInput } from '@/components/VoiceButton';

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
}

export default function CookLog() {
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
      alert(err instanceof Error ? err.message : 'Failed');
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
      alert(err instanceof Error ? err.message : 'Failed');
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
    <div className="space-y-4">
      <h2 className="font-display text-xl text-chef-800">Log a Meal</h2>
      <p className="text-sage-600 text-sm">Tell me what you cooked — I'll update your pantry and optionally share the recipe.</p>

      {confirmed ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-semibold text-chef-700">Inventory Updated!</p>
          {shared && <p className="text-sm text-sage-600 mt-2 flex items-center justify-center gap-1"><Share2 size={14} /> Recipe shared with community</p>}
        </div>
      ) : suggested ? (
        <div className="space-y-4">
          <div className="card bg-chef-50">
            <p className="font-medium">{mealName}</p>
            <p className="text-sm text-sage-600 mt-1">Did you use these ingredients?</p>
          </div>
          {suggested.map((item, idx) => (
            <div key={idx} className="card flex items-center justify-between">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => adjustItem(idx, -1)} className="w-10 h-10 rounded-full bg-sage-100 font-bold">−</button>
                <span className="w-16 text-center font-semibold">{item.quantity} {item.unit}</span>
                <button onClick={() => adjustItem(idx, 1)} className="w-10 h-10 rounded-full bg-sage-100 font-bold">+</button>
              </div>
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-sage-700">
            <input type="checkbox" checked={shareRecipe} onChange={(e) => setShareRecipe(e.target.checked)} className="rounded" />
            Share this meal as a community recipe
          </label>
          <div className="flex gap-3">
            <button onClick={() => setSuggested(null)} className="btn-secondary flex-1">No, Edit</button>
            <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
              <Check size={18} /> Yes, Update Pantry
            </button>
          </div>
        </div>
      ) : (
        <>
          <VoiceInput value={input} onChange={setInput} placeholder="I made grilled cheese..." onSubmit={handleSubmit} />
          <button onClick={handleSubmit} disabled={loading || !input.trim()} className="btn-primary w-full">
            {loading ? 'Thinking...' : 'Log Meal'}
          </button>
          <div>
            <p className="text-xs text-sage-500 mb-2">Quick tap:</p>
            <div className="flex flex-wrap gap-2">
              {quickMeals.map((m) => (
                <button key={m} onClick={() => setInput(m)} className="tap-item text-sm py-2 px-3">{m}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
