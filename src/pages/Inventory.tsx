import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { LOCATION_EMOJI } from '@/lib/utils';
import type { InventoryItem } from '@/types';

const LOCATIONS = ['all', 'pantry', 'fridge', 'freezer'] as const;

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    inventoryApi.list().then((r) => setItems(r.items)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.location === filter);

  const adjustQty = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    await inventoryApi.update({ id: item.id, quantity: newQty });
    load();
  };

  const remove = async (id: string) => {
    await inventoryApi.remove(id);
    load();
  };

  const grouped = filtered.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="font-sans font-semibold text-xl text-chef">Your Pantry</h2>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setFilter(loc)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === loc ? 'bg-chef text-white' : 'bg-white border border-steel text-chef-subtle'
            }`}
          >
            {loc === 'all' ? 'All' : `${LOCATION_EMOJI[loc]} ${loc}`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-chef-subtle text-center py-8">Loading pantry...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-chef-subtle">No items yet.</p>
          <p className="text-sm text-steel-dark mt-2">Scan a receipt or use the Pantry Wizard to get started.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catItems]) => (
          <section key={category}>
            <h3 className="text-sm font-semibold text-chef-subtle uppercase tracking-wide mb-2">{category}</h3>
            <div className="space-y-2">
              {catItems.map((item) => (
                <div key={item.id} className="card flex items-center gap-3">
                  <span className="text-xl">{LOCATION_EMOJI[item.location] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-chef-subtle">
                      {item.quantity} {item.unit}
                      {item.expiration_date && ` · exp ${item.expiration_date}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustQty(item, -1)} className="btn-icon bg-stainless-200 text-chef-subtle w-9 h-9">
                      <Minus size={16} />
                    </button>
                    <button onClick={() => adjustQty(item, 1)} className="btn-icon bg-stainless-200 text-chef-subtle w-9 h-9">
                      <Plus size={16} />
                    </button>
                    <button onClick={() => remove(item.id)} className="btn-icon bg-red-50 text-red-500 w-9 h-9">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
