import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Sparkles, Merge } from 'lucide-react';
import { inventoryApi, inventoryStewardApi } from '@/lib/api';
import { LOCATION_EMOJI } from '@/lib/utils';
import { inferWizardItemLocation, type InventoryItem } from '@/types';
import type { DuplicateGroup, StewardPreview } from '@/types/inventorySteward';
import { useToast } from '@/hooks/useToast';

const LOCATIONS = ['all', 'pantry', 'fridge', 'freezer'] as const;
const STORAGE_LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;

function isLowStock(item: InventoryItem): boolean {
  const threshold = Number(item.low_stock_threshold ?? 0);
  if (threshold > 0) return Number(item.quantity) <= threshold;
  return Number(item.quantity) <= 1;
}

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [preview, setPreview] = useState<StewardPreview | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      inventoryApi.list().then((r) => setItems(r.items)),
      inventoryStewardApi.preview().then((r) => setPreview(r.preview)).catch(() => setPreview(null)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.location === filter);

  const expiring = items.filter((i) => {
    if (!i.expiration_date) return false;
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  const lowStockIds = useMemo(() => new Set(preview?.low_stock.map((l) => l.item_id) ?? []), [preview]);

  const adjustQty = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    try {
      await inventoryApi.update({ id: item.id, quantity: newQty });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update quantity');
    }
  };

  const remove = async (id: string) => {
    try {
      await inventoryApi.remove(id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove item');
    }
  };

  const cycleLocation = async (item: InventoryItem) => {
    const idx = STORAGE_LOCATIONS.indexOf(item.location);
    const next = STORAGE_LOCATIONS[(idx + 1) % STORAGE_LOCATIONS.length];
    try {
      await inventoryApi.update({ id: item.id, location: next });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update location');
    }
  };

  const mergeGroup = async (group: DuplicateGroup) => {
    setMerging(group.id);
    try {
      await inventoryStewardApi.merge(group.suggested_keep_id, group.item_ids);
      toast.success('Merged duplicate items');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setMerging(null);
    }
  };

  const likelyMislocated = useMemo(() => {
    if (items.length < 3) return false;
    const freezerOnly = items.every((i) => i.location === 'freezer');
    if (!freezerOnly) return false;
    return items.some((i) => inferWizardItemLocation(i.name) !== 'freezer');
  }, [items]);

  const fixLocations = async () => {
    setLoading(true);
    try {
      await Promise.all(
        items.map(async (item) => {
          const inferred = inferWizardItemLocation(item.name);
          if (item.location !== inferred) {
            await inventoryApi.update({ id: item.id, location: inferred });
          }
        }),
      );
      load();
    } finally {
      setLoading(false);
    }
  };

  const grouped = filtered.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-sans font-semibold text-xl text-chef">Kitchen Inventory</h2>
        <p className="text-sm text-chef-subtle mt-1">
          {items.length} ingredient{items.length !== 1 ? 's' : ''} on hand
          {expiring.length > 0 && (
            <> · <span className="text-burgundy-600 font-medium">{expiring.length} need attention</span></>
          )}
          {preview?.low_stock.length ? (
            <> · <span className="text-amber-700 font-medium">{preview.low_stock.length} low stock</span></>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link to="/assistant?q=Audit%20my%20pantry" className="btn-secondary text-sm inline-flex items-center gap-1.5 min-h-[44px]">
            <Sparkles size={16} /> Ask Clara to audit
          </Link>
          {expiring[0] && (
            <Link
              to={`/assistant?q=${encodeURIComponent(`What can I cook with ${expiring[0].name} before it expires?`)}`}
              className="text-link text-sm min-h-[44px] inline-flex items-center"
            >
              Use {expiring[0].name} soon →
            </Link>
          )}
        </div>
        <Link to="/" className="text-link !min-h-0 text-xs mt-2 inline-flex">← Kitchen Status</Link>
      </header>

      {preview?.duplicates.map((group) => (
        <div key={group.id} className="card bg-copper-50 border-copper-200 space-y-2">
          <p className="text-sm font-medium text-chef flex items-center gap-2">
            <Merge size={16} /> Possible duplicate
          </p>
          <p className="text-sm text-chef-subtle">{group.names.join(' · ')}</p>
          <button
            type="button"
            disabled={merging === group.id}
            onClick={() => mergeGroup(group)}
            className="btn-secondary text-sm"
          >
            {merging === group.id ? 'Merging…' : 'Merge into one item'}
          </button>
        </div>
      ))}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setFilter(loc)}
            className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap min-h-[52px] ${
              filter === loc ? 'bg-chef text-white' : 'bg-white border border-steel text-chef-subtle'
            }`}
          >
            {loc === 'all' ? 'All' : `${LOCATION_EMOJI[loc]} ${loc}`}
          </button>
        ))}
      </div>

      {likelyMislocated && (
        <div className="card bg-amber-50 border-amber-200 space-y-2">
          <p className="text-sm text-chef">
            Everything looks stored in the freezer — that usually means locations need fixing after Pantry Wizard.
          </p>
          <button type="button" onClick={fixLocations} className="btn-secondary text-sm">
            Fix locations automatically
          </button>
        </div>
      )}

      {loading && <div className="card text-chef-subtle text-sm min-h-[52px] flex items-center">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-8 text-chef-subtle space-y-3">
          <p>No ingredients yet.</p>
          <Link to="/receipt" className="btn-primary inline-flex">Scan a receipt</Link>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <section key={cat} className="space-y-2">
          <h3 className="section-label capitalize">{cat}</h3>
          {catItems.map((item) => (
            <div key={item.id} className="card flex items-center justify-between gap-3 min-h-[52px]">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate flex items-center gap-2">
                  {item.name}
                  {lowStockIds.has(item.id) || isLowStock(item) ? (
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Low
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-chef-subtle">
                  {item.quantity} {item.unit}
                  {item.expiration_date && ` · exp ${item.expiration_date}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => cycleLocation(item)}
                  className="btn-icon bg-stainless-100 text-lg"
                  title={`Move from ${item.location}`}
                  aria-label={`Location: ${item.location}. Tap to change.`}
                >
                  {LOCATION_EMOJI[item.location] ?? '📦'}
                </button>
                <button onClick={() => adjustQty(item, -1)} className="btn-icon bg-stainless-200 text-chef font-bold">−</button>
                <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                <button onClick={() => adjustQty(item, 1)} className="btn-icon bg-stainless-200 text-chef font-bold">+</button>
                <button onClick={() => remove(item.id)} className="btn-icon text-burgundy-600 hover:bg-burgundy-50" aria-label="Remove">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
