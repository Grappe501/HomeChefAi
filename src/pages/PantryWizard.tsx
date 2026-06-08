import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { PANTRY_CATEGORIES, QUICK_QUANTITIES } from '@/types';
import { inventoryApi } from '@/lib/api';
import { parseQuantityOption, speak } from '@/lib/utils';

export default function PantryWizard() {
  const categories = Object.entries(PANTRY_CATEGORIES);
  const [catIdx, setCatIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, { quantity: number; unit: string }>>({});
  const [quantityItem, setQuantityItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [catName, catData] = categories[catIdx];

  const toggleItem = (item: string) => {
    if (selected[item]) {
      const next = { ...selected };
      delete next[item];
      setSelected(next);
    } else {
      setQuantityItem(item);
    }
  };

  const setQuantity = (option: string) => {
    if (!quantityItem) return;
    const { quantity, unit } = parseQuantityOption(option);
    setSelected({ ...selected, [quantityItem]: { quantity, unit } });
    setQuantityItem(null);
  };

  const handleNext = async () => {
    if (catIdx < categories.length - 1) {
      setCatIdx(catIdx + 1);
      return;
    }
    setSaving(true);
    const items = Object.entries(selected).map(([name, { quantity, unit }]) => ({
      name,
      quantity,
      unit,
      category: catName.toLowerCase().replace(/[^a-z]/g, '_'),
      location: catData.location as 'pantry' | 'fridge' | 'freezer',
      added_via: 'wizard',
    }));
    try {
      await inventoryApi.add(items);
      speak(`Added ${items.length} items to your pantry!`);
      setDone(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="font-display text-xl text-chef-800">Pantry Updated!</h2>
        <p className="text-sage-600">Your items are saved. Ready to plan some meals?</p>
        <a href="/meals" className="btn-primary inline-flex">Plan Meals</a>
      </div>
    );
  }

  const qtyOptions = quantityItem
    ? QUICK_QUANTITIES[quantityItem] || QUICK_QUANTITIES.default
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-chef-800">Pantry Wizard</h2>
        <span className="text-sm text-sage-500">{catIdx + 1}/{categories.length}</span>
      </div>
      <p className="text-sage-600 text-sm">Tap items you have. No typing needed!</p>

      <div className="card bg-chef-50">
        <h3 className="font-semibold text-chef-800">{catName}</h3>
        <p className="text-xs text-sage-500 mt-1">📍 {catData.location}</p>
      </div>

      {quantityItem ? (
        <div className="space-y-3">
          <p className="font-medium">How much <span className="text-chef-600">{quantityItem}</span>?</p>
          <div className="grid grid-cols-2 gap-2">
            {qtyOptions.map((opt) => (
              <button key={opt} onClick={() => setQuantity(opt)} className="tap-item">
                {opt}
              </button>
            ))}
          </div>
          <button onClick={() => setQuantityItem(null)} className="text-sm text-sage-500">Cancel</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {catData.items.map((item) => (
            <button
              key={item}
              onClick={() => toggleItem(item)}
              className={`tap-item relative ${selected[item] ? 'tap-item-selected' : ''}`}
            >
              {selected[item] && <Check size={14} className="absolute top-1 right-1 text-chef-600" />}
              {item}
              {selected[item] && (
                <span className="block text-xs text-chef-600 mt-0.5">
                  {selected[item].quantity} {selected[item].unit}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {catIdx > 0 && (
          <button onClick={() => setCatIdx(catIdx - 1)} className="btn-secondary flex-1">Back</button>
        )}
        <button onClick={handleNext} disabled={saving || !!quantityItem} className="btn-primary flex-1">
          {saving ? 'Saving...' : catIdx < categories.length - 1 ? (
            <>Next <ChevronRight size={18} /></>
          ) : (
            <>Save Pantry ({Object.keys(selected).length} items)</>
          )}
        </button>
      </div>
    </div>
  );
}
