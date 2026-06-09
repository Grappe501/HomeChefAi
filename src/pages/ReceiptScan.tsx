import { useState, useRef } from 'react';
import { Camera, Check, Upload, Pencil, EyeOff, RotateCcw, CheckCheck } from 'lucide-react';
import { receiptsApi } from '@/lib/api';
import { fileToBase64, speak } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import type { Receipt, ReceiptItem, ReceiptParseResult } from '@/types';

interface EditableReceiptItem extends ReceiptItem {
  _id: string;
  ignored: boolean;
}

const CATEGORIES = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverage', 'other'] as const;
const LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;
const UNITS = ['each', 'lb', 'oz', 'gallon', 'dozen', 'bag', 'box', 'bottle', 'can'];

function toEditable(items: ReceiptItem[]): EditableReceiptItem[] {
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

export default function ReceiptScan() {
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [parsed, setParsed] = useState<ReceiptParseResult | null>(null);
  const [items, setItems] = useState<EditableReceiptItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => !i.ignored).length;

  const handleFile = async (file: File) => {
    setScanning(true);
    const loadId = toast.loading('Scanning receipt…');
    try {
      const base64 = await fileToBase64(file);
      const result = await receiptsApi.scan(base64);
      setReceipt(result.receipt);
      setParsed(result.parsed);
      setItems(toEditable(result.parsed.items));
      setEditingId(null);
      toast.dismiss(loadId);
      toast.success(`Found ${result.parsed.items.length} items`);
      speak(`I found ${result.parsed.items.length} items from ${result.parsed.store_name || 'the store'}. Review and edit before adding.`);
    } catch (err) {
      toast.dismiss(loadId);
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const updateItem = (id: string, patch: Partial<EditableReceiptItem>) => {
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...patch } : i)));
  };

  const toggleIgnore = (id: string) => {
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ignored: !i.ignored } : i)));
  };

  const restoreAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, ignored: false })));
    toast.info('All items restored');
  };

  const handleVerify = async () => {
    if (!receipt || activeCount === 0) {
      toast.error('Add at least one item to your pantry');
      return;
    }
    setVerifying(true);
    const loadId = toast.loading(`Adding ${activeCount} items to pantry...`);
    try {
      const approved = items
        .filter((i) => !i.ignored)
        .map(({ _id, ignored, ...item }) => item);
      const result = await receiptsApi.verify(receipt.id, approved);
      toast.dismiss(loadId);
      toast.success(`Added ${result.items_added} items · +${result.xp_gained ?? 30} XP`);
      speak(`Added ${result.items_added} items to your pantry!`);
      setReceipt(null);
      setParsed(null);
      setItems([]);
      setEditingId(null);
    } catch (err) {
      toast.dismiss(loadId);
      toast.error(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-sans font-semibold text-xl text-chef">Scan Receipt</h2>
      <p className="text-chef-subtle text-sm">
        Review and edit each item before adding to your pantry. Ignored items won't be added.
      </p>

      {!parsed ? (
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="btn-primary w-full min-h-[52px]"
          >
            {scanning ? 'Scanning receipt…' : (
              <><Camera size={22} /> Take Photo / Upload Receipt</>
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
            <p className="text-sm text-chef-subtle">Snap your receipt when you get home from the store</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card bg-stainless-200 border-steel">
            <h3 className="font-semibold">{parsed.store_name || 'Receipt'}</h3>
            <p className="text-sm text-chef-subtle mt-1">
              {parsed.date} · ${parsed.total?.toFixed(2) || '0.00'} · {activeCount} of {items.length} items selected
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={restoreAll} className="btn-secondary text-sm py-2 px-4 min-h-[44px]">
              <RotateCcw size={16} /> Restore all
            </button>
            <button
              onClick={() => { setItems((prev) => prev.map((i) => ({ ...i, ignored: false }))); toast.success('All items approved'); }}
              className="btn-secondary text-sm py-2 px-4 min-h-[44px]"
            >
              <CheckCheck size={16} /> Approve all
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className={`card ${item.ignored ? 'opacity-50 bg-stainless-100' : ''} ${editingId === item._id ? 'ring-2 ring-chef' : ''}`}
              >
                {editingId === item._id ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-chef-subtle">Name</span>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item._id, { name: e.target.value })}
                        className="input-field mt-1"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-medium text-chef-subtle">Qty</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(item._id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="input-field mt-1"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-chef-subtle">Unit</span>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item._id, { unit: e.target.value })}
                          className="input-field mt-1"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-medium text-chef-subtle">Category</span>
                        <select
                          value={item.category || 'other'}
                          onChange={(e) => updateItem(item._id, { category: e.target.value })}
                          className="input-field mt-1"
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-chef-subtle">Location</span>
                        <select
                          value={item.location || 'pantry'}
                          onChange={(e) => updateItem(item._id, { location: e.target.value })}
                          className="input-field mt-1"
                        >
                          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs font-medium text-chef-subtle">Price ($)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price ?? ''}
                        onChange={(e) => updateItem(item._id, { price: parseFloat(e.target.value) || undefined })}
                        className="input-field mt-1"
                        placeholder="0.00"
                      />
                    </label>
                    <button onClick={() => setEditingId(null)} className="btn-primary w-full min-h-[48px]">
                      Done editing
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${item.ignored ? 'line-through text-steel-dark' : ''}`}>{item.name}</p>
                      <p className="text-xs text-chef-subtle mt-1">
                        {item.quantity} {item.unit} · {item.category} · {item.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {item.price != null && (
                        <span className="text-sm font-medium text-chef-subtle">${item.price.toFixed(2)}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(item._id)}
                          className="btn-icon bg-stainless-200 text-chef-muted min-w-[44px] min-h-[44px]"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => toggleIgnore(item._id)}
                          className="btn-icon bg-stainless-200 text-chef-subtle min-w-[44px] min-h-[44px]"
                          title={item.ignored ? 'Restore' : 'Ignore'}
                        >
                          {item.ignored ? <RotateCcw size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleVerify}
              disabled={verifying || activeCount === 0}
              className="btn-primary w-full min-h-[52px]"
            >
              {verifying ? 'Adding to pantry...' : (
                <><Check size={22} /> Confirm & Add {activeCount} Items</>
              )}
            </button>
            <button
              onClick={() => { setParsed(null); setReceipt(null); setItems([]); setEditingId(null); }}
              className="btn-secondary w-full min-h-[48px]"
            >
              Retake photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
