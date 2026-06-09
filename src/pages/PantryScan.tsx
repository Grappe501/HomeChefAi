import { useState, useRef } from 'react';
import { Camera, Check, Upload, Pencil, EyeOff, RotateCcw } from 'lucide-react';
import { pantryScanApi } from '@/lib/api';
import { fileToBase64, speak } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import type { PantryScanItem } from '@/types/kitchenPredictions';

interface EditableItem extends PantryScanItem {
  _id: string;
  ignored: boolean;
}

const CATEGORIES = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverage', 'other'] as const;
const LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;
const UNITS = ['each', 'lb', 'oz', 'gallon', 'dozen', 'bag', 'box', 'bottle', 'can', 'cup'];

function toEditable(items: PantryScanItem[]): EditableItem[] {
  return items.map((item, idx) => ({
    ...item,
    _id: `item-${idx}-${item.name}`,
    ignored: false,
    quantity: item.quantity ?? 1,
    unit: item.unit || 'each',
    category: item.category || 'other',
    location: item.location || 'pantry',
  }));
}

export default function PantryScan() {
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [sceneSummary, setSceneSummary] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => !i.ignored).length;

  const handleFile = async (file: File) => {
    setScanning(true);
    const loadId = toast.loading('Scanning pantry…');
    try {
      const base64 = await fileToBase64(file);
      const result = await pantryScanApi.scan(base64);
      setSceneSummary(result.parsed.scene_summary ?? null);
      setItems(toEditable(result.parsed.items));
      setEditingId(null);
      toast.dismiss(loadId);
      toast.success(`Found ${result.parsed.items.length} items · ${result.credit_cost ?? 2} credits`);
      speak(`I spotted ${result.parsed.items.length} items. Review before adding to your pantry.`);
    } catch (err) {
      toast.dismiss(loadId);
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const updateItem = (id: string, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...patch } : i)));
  };

  const toggleIgnore = (id: string) => {
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ignored: !i.ignored } : i)));
  };

  const handleConfirm = async () => {
    if (activeCount === 0) {
      toast.error('Select at least one item');
      return;
    }
    setConfirming(true);
    try {
      const payload = items.filter((i) => !i.ignored).map(({ _id, ignored, ...rest }) => rest);
      const result = await pantryScanApi.confirm(payload);
      toast.success(`Added ${result.items_added} items to pantry`);
      speak(`Added ${result.items_added} items to your pantry.`);
      setItems([]);
      setSceneSummary(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add items');
    } finally {
      setConfirming(false);
    }
  };

  const hasResults = items.length > 0;

  return (
    <div className="space-y-5">
      <h2 className="font-sans font-semibold text-xl text-chef">Pantry Photo</h2>
      <p className="text-chef-subtle text-sm">
        Snap your fridge, shelf, or pantry. Clara identifies items and links them to the knowledge graph. 2 credits per scan.
      </p>

      {!hasResults ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="btn-primary w-full min-h-[52px]"
          >
            {scanning ? 'Analyzing photo…' : (
              <>
                <Camera size={22} /> Photo fridge / pantry
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="card text-center py-8 border-dashed border-2 border-steel">
            <Upload className="mx-auto text-steel mb-3" size={36} />
            <p className="text-sm text-chef-subtle">Great for mobile — no receipt needed</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sceneSummary && (
            <div className="card bg-stainless-200 border-steel">
              <p className="text-sm text-chef">{sceneSummary}</p>
              <p className="text-xs text-chef-subtle mt-1">{activeCount} of {items.length} items selected</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className={`card ${item.ignored ? 'opacity-50 bg-stainless-100' : ''} ${editingId === item._id ? 'ring-2 ring-chef' : ''}`}
              >
                {editingId === item._id ? (
                  <div className="space-y-3">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item._id, { name: e.target.value })}
                      className="input-field"
                      placeholder="Name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item._id, { unit: e.target.value })}
                        className="input-field"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(item._id, { category: e.target.value })}
                        className="input-field"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={item.location}
                        onChange={(e) => updateItem(item._id, { location: e.target.value as EditableItem['location'] })}
                        className="input-field"
                      >
                        {LOCATIONS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-primary w-full">
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-medium ${item.ignored ? 'line-through' : ''}`}>{item.name}</p>
                      <p className="text-xs text-chef-subtle mt-1">
                        {item.quantity} {item.unit} · {item.category} · {item.location}
                      </p>
                      {item.knowledge_id && (
                        <p className="text-[10px] text-copper-700 mt-1 truncate">{item.knowledge_id}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => setEditingId(item._id)} className="btn-icon bg-stainless-200 min-w-[44px] min-h-[44px]">
                        <Pencil size={18} />
                      </button>
                      <button type="button" onClick={() => toggleIgnore(item._id)} className="btn-icon bg-stainless-200 min-w-[44px] min-h-[44px]">
                        {item.ignored ? <RotateCcw size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || activeCount === 0}
            className="btn-primary w-full min-h-[52px]"
          >
            {confirming ? 'Adding…' : (
              <>
                <Check size={22} /> Add {activeCount} items to pantry
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setItems([]); setSceneSummary(null); }}
            className="btn-secondary w-full"
          >
            Retake photo
          </button>
        </div>
      )}
    </div>
  );
}
