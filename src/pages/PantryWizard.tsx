import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { PANTRY_CATEGORIES } from '@/types';
import { getWizardItemConfig, type WizardQuantityOption } from '@/types/pantryWizard';
import { inventoryApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';

interface SelectedItem {
  quantity: number;
  unit: string;
  label: string;
}

export default function PantryWizard() {
  const { refreshProfile } = useApp();
  const toast = useToast();
  const categories = Object.entries(PANTRY_CATEGORIES);
  const [catIdx, setCatIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
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

  const setQuantity = (option: WizardQuantityOption) => {
    if (!quantityItem) return;
    setSelected({
      ...selected,
      [quantityItem]: {
        quantity: option.quantity,
        unit: option.unit,
        label: option.label,
      },
    });
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
      const result = await inventoryApi.add(items);
      await refreshProfile();
      const xp = (result as { xp_gained?: number }).xp_gained ?? 15;
      toast.success(`Added ${items.length} items · +${xp} XP`);
      speak(`Added ${items.length} items to your pantry!`);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="font-sans font-semibold text-xl text-chef">Kitchen Inventory Updated</h2>
        <p className="text-chef-subtle">Your items are saved. Ready to plan some meals?</p>
        <a href="/meals" className="btn-primary inline-flex">Plan Meals</a>
      </div>
    );
  }

  const itemConfig = quantityItem ? getWizardItemConfig(quantityItem) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans font-semibold text-xl text-chef">Pantry Wizard</h2>
        <span className="text-sm text-chef-subtle">{catIdx + 1}/{categories.length}</span>
      </div>
      <p className="text-chef-subtle text-sm">Tap what you have — pick a sensible size. No typing needed.</p>

      <div className="card bg-stainless-200">
        <h3 className="font-semibold text-chef">{catName}</h3>
        <p className="text-xs text-chef-subtle mt-1">{catData.location}</p>
      </div>

      {quantityItem && itemConfig ? (
        <div className="space-y-3">
          <p className="font-medium text-chef">
            How much <span className="text-chef-muted">{quantityItem}</span>?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {itemConfig.level1Options.map((opt) => (
              <button key={opt.label} onClick={() => setQuantity(opt)} className="tap-item">
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={() => setQuantityItem(null)} className="text-sm text-chef-subtle min-h-[52px]">
            Cancel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {catData.items.map((item) => (
            <button
              key={item}
              onClick={() => toggleItem(item)}
              className={`tap-item relative ${selected[item] ? 'tap-item-selected' : ''}`}
            >
              {selected[item] && <Check size={14} className="absolute top-2 right-2 text-chef-muted" />}
              <span className="font-medium">{item}</span>
              {selected[item] && (
                <span className="block text-xs text-chef-subtle mt-1">{selected[item].label}</span>
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
            <>Save Inventory ({Object.keys(selected).length} items)</>
          )}
        </button>
      </div>
    </div>
  );
}
