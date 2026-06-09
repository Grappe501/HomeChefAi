import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { PANTRY_CATEGORIES, pantryCategorySlug } from '@/types';
import { getWizardItemConfig, type WizardQuantityOption } from '@/types/pantryWizard';
import {
  buildTaxonomySelection,
  encodeTaxonomyNotes,
  formatSelectedLabel,
  getFormOptions,
  getTaxonomyFamilyByWizardItem,
  isFormFirstWizardItem,
  resolveInventoryLocation,
  resolveInventoryName,
  type TaxonomyFormOption,
} from '@/types/foodTaxonomy';
import { resolveWizardInventoryKnowledge } from '@/types/knowledgeId';
import { inventoryApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';

interface SelectedItem {
  quantity: number;
  unit: string;
  label: string;
  /** Key in selected map — wizard tile or resolved inventory name */
  inventoryName: string;
  /** Original wizard tile label for knowledge id resolution */
  wizardItem: string;
  category: string;
  location: 'pantry' | 'fridge' | 'freezer';
  notes?: string;
  knowledge_id?: string;
  taxonomy_id?: string;
}

type WizardPickerStep =
  | { kind: 'form'; item: string }
  | { kind: 'quantity'; item: string; formOption: TaxonomyFormOption }
  | { kind: 'quantity_simple'; item: string };

export default function PantryWizard() {
  const { refreshProfile } = useApp();
  const toast = useToast();
  const categories = Object.entries(PANTRY_CATEGORIES);
  const [catIdx, setCatIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [pickerStep, setPickerStep] = useState<WizardPickerStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [catName, catData] = categories[catIdx];

  const isItemSelected = (item: string) => {
    if (selected[item]) return true;
    if (isFormFirstWizardItem(item)) {
      return Object.values(selected).some((s) =>
        getFormOptions(item).some((f) => resolveInventoryName(item, f) === s.inventoryName),
      );
    }
    return false;
  };

  const findSelectedForWizardItem = (item: string): SelectedItem | undefined => {
    if (selected[item]) return selected[item];
    if (isFormFirstWizardItem(item)) {
      const formNames = getFormOptions(item).map((f) => resolveInventoryName(item, f));
      const entry = Object.entries(selected).find(([, v]) => formNames.includes(v.inventoryName));
      return entry?.[1];
    }
    return undefined;
  };

  const toggleItem = (item: string) => {
    if (isItemSelected(item)) {
      const next = { ...selected };
      if (next[item]) {
        delete next[item];
      } else if (isFormFirstWizardItem(item)) {
        for (const form of getFormOptions(item)) {
          const name = resolveInventoryName(item, form);
          for (const key of Object.keys(next)) {
            if (next[key]?.inventoryName === name) delete next[key];
          }
        }
      }
      setSelected(next);
      return;
    }

    if (isFormFirstWizardItem(item)) {
      setPickerStep({ kind: 'form', item });
      return;
    }
    setPickerStep({ kind: 'quantity_simple', item });
  };

  const setQuantity = (option: WizardQuantityOption) => {
    if (!pickerStep) return;

    if (pickerStep.kind === 'quantity_simple') {
      const { item } = pickerStep;
      const { knowledge_id } = resolveWizardInventoryKnowledge(item);
      setSelected({
        ...selected,
        [item]: {
          quantity: option.quantity,
          unit: option.unit,
          label: option.label,
          inventoryName: item,
          wizardItem: item,
          category: pantryCategorySlug(catName),
          location: catData.location as 'pantry' | 'fridge' | 'freezer',
          knowledge_id,
        },
      });
      setPickerStep(null);
      return;
    }

    if (pickerStep.kind !== 'quantity') return;

    const { item, formOption } = pickerStep;
    const family = getTaxonomyFamilyByWizardItem(item);
    if (!family) return;

    const inventoryName = resolveInventoryName(item, formOption);
    const selection = buildTaxonomySelection(family, formOption);
    const { knowledge_id, taxonomy_id } = resolveWizardInventoryKnowledge(item, selection);
    const key = item === inventoryName ? item : `${item}::${formOption.id}`;

    setSelected({
      ...selected,
      [key]: {
        quantity: option.quantity,
        unit: option.unit,
        label: formatSelectedLabel(formOption, option.label),
        inventoryName,
        wizardItem: item,
        category: pantryCategorySlug(catName),
        location: resolveInventoryLocation(catData.location as 'pantry' | 'fridge' | 'freezer', formOption),
        notes: encodeTaxonomyNotes(selection),
        knowledge_id,
        taxonomy_id,
      },
    });
    setPickerStep(null);
  };

  const handleFormPick = (formOption: TaxonomyFormOption) => {
    if (pickerStep?.kind !== 'form') return;
    setPickerStep({ kind: 'quantity', item: pickerStep.item, formOption });
  };

  const handleNext = async () => {
    if (catIdx < categories.length - 1) {
      setCatIdx(catIdx + 1);
      return;
    }
    setSaving(true);
    const items = Object.values(selected).map(({ inventoryName, quantity, unit, location, category, notes, knowledge_id, taxonomy_id }) => ({
      name: inventoryName,
      quantity,
      unit,
      category,
      location,
      added_via: 'wizard',
      notes,
      knowledge_id,
      taxonomy_id,
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

  const simpleConfig =
    pickerStep?.kind === 'quantity_simple' ? getWizardItemConfig(pickerStep.item) : null;
  const formQuantityOptions =
    pickerStep?.kind === 'quantity' ? pickerStep.formOption.quantityOptions : null;

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

      {pickerStep?.kind === 'form' ? (
        <div className="space-y-3">
          <p className="font-medium text-chef">
            What kind of <span className="text-chef-muted">{pickerStep.item}</span>?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {getFormOptions(pickerStep.item).map((opt) => (
              <button key={opt.id} onClick={() => handleFormPick(opt)} className="tap-item">
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={() => setPickerStep(null)} className="text-sm text-chef-subtle min-h-[52px]">
            Cancel
          </button>
        </div>
      ) : pickerStep?.kind === 'quantity' || pickerStep?.kind === 'quantity_simple' ? (
        <div className="space-y-3">
          <p className="font-medium text-chef">
            How much{' '}
            <span className="text-chef-muted">
              {pickerStep.kind === 'quantity'
                ? resolveInventoryName(pickerStep.item, pickerStep.formOption)
                : pickerStep.item}
            </span>
            ?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(formQuantityOptions ?? simpleConfig?.level1Options ?? []).map((opt) => (
              <button key={opt.label} onClick={() => setQuantity(opt)} className="tap-item">
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setPickerStep(
                pickerStep.kind === 'quantity'
                  ? { kind: 'form', item: pickerStep.item }
                  : null,
              )
            }
            className="text-sm text-chef-subtle min-h-[52px]"
          >
            Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {catData.items.map((item) => {
            const sel = findSelectedForWizardItem(item);
            return (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={`tap-item relative ${isItemSelected(item) ? 'tap-item-selected' : ''}`}
              >
                {isItemSelected(item) && (
                  <Check size={14} className="absolute top-2 right-2 text-chef-muted" />
                )}
                <span className="font-medium">{item}</span>
                {sel && (
                  <span className="block text-xs text-chef-subtle mt-1">{sel.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {catIdx > 0 && (
          <button onClick={() => setCatIdx(catIdx - 1)} className="btn-secondary flex-1">Back</button>
        )}
        <button onClick={handleNext} disabled={saving || !!pickerStep} className="btn-primary flex-1">
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
