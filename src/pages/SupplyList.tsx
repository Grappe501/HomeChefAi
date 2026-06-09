import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, RefreshCw, Plus, Copy, Trash2, CalendarDays, Store } from 'lucide-react';
import { supplyApi } from '@/lib/api';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import { groupSupplyListItems, copySupplyListText, supplyProgress } from '@/lib/supplyListOps';
import { SUPPLY_GROUP_ORDER } from '@/lib/supplyPlan';
import type { RunningSupplyList } from '@/types/supplyList';

export default function SupplyListPage() {
  const { profile } = useApp();
  const toast = useToast();
  const [list, setList] = useState<RunningSupplyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('each');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { list: data } = await supplyApi.get();
      if (!data.items.length) {
        const synced = await supplyApi.syncLatest();
        setList(synced.list);
      } else {
        setList(data);
      }
    } catch {
      toast.error('Could not load supply list');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(
    () => (list?.items.length ? groupSupplyListItems(list.items) : null),
    [list?.items],
  );

  const progress = list?.items.length ? supplyProgress(list.items) : null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await supplyApi.syncLatest();
      setList(result.list);
      toast.success(
        result.synced
          ? `Synced from ${result.plan?.title ?? 'your meal plan'}`
          : 'No meal plan found — add items manually or plan meals first',
      );
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (itemId: string, checked: boolean) => {
    try {
      const { list: updated } = await supplyApi.toggleItem(itemId, checked);
      setList(updated);
    } catch {
      toast.error('Could not update item');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const { list: updated } = await supplyApi.removeItem(itemId);
      setList(updated);
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const { list: updated } = await supplyApi.addItem(name, Number(newQty) || 1, newUnit.trim() || 'each');
      setList(updated);
      setNewName('');
      setNewQty('1');
    } catch {
      toast.error('Could not add item');
    }
  };

  const handleClearChecked = async () => {
    try {
      const { list: updated } = await supplyApi.clearChecked();
      setList(updated);
      toast.success('Checked items cleared');
    } catch {
      toast.error('Could not clear items');
    }
  };

  const handleCopy = async () => {
    if (!list?.items.length || !grouped) return;
    const text = copySupplyListText(grouped, SUPPLY_GROUP_ORDER);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('List copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <header>
        <h1 className="font-sans font-semibold text-xl text-chef flex items-center gap-2">
          <ShoppingCart size={22} className="text-copper-600" />
          Kitchen Supply List
        </h1>
        <p className="text-sm text-chef-subtle mt-1">
          Your running grocery list — synced from meal plans, checked off as you shop.
        </p>
      </header>

      {profile?.preferred_store && (
        <div className="card flex items-start gap-3 bg-sage-50/50 border-sage-200/80">
          <Store size={18} className="text-sage-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-sage-800 uppercase tracking-wide">Preferred store</p>
            <p className="text-sm text-chef mt-0.5">{profile.preferred_store}</p>
            <p className="text-xs text-chef-subtle mt-1">Ask Clara for aisle tips while you shop.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleSync} disabled={syncing} className="btn-secondary flex-1 min-w-[140px]">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync from plan'}
        </button>
        <Link to="/meals" className="btn-secondary flex-1 min-w-[140px] inline-flex items-center justify-center gap-2">
          <CalendarDays size={16} /> Meal planner
        </Link>
      </div>

      {list?.plan_title && (
        <p className="text-xs text-chef-subtle">
          From plan: <span className="font-medium text-chef">{list.plan_title}</span>
        </p>
      )}

      {loading && <p className="text-sm text-chef-subtle animate-pulse">Loading supply list…</p>}

      {!loading && list && list.items.length === 0 && (
        <section className="card text-center space-y-4 py-8">
          <ShoppingCart size={40} className="mx-auto text-chef-subtle/40" />
          <div>
            <p className="font-medium text-chef">No items yet</p>
            <p className="text-sm text-chef-subtle mt-1 max-w-xs mx-auto">
              Generate a meal plan and your grocery list builds automatically — or add items below.
            </p>
          </div>
          <Link to="/meals" className="btn-primary inline-flex">Plan meals</Link>
        </section>
      )}

      {!loading && list && list.items.length > 0 && grouped && (
        <>
          {progress && (
            <div className="card py-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-chef">Shopping progress</span>
                <span className="text-chef-subtle">
                  {progress.checked} / {progress.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-stainless-200 overflow-hidden">
                <div
                  className="h-full bg-copper-500 transition-all"
                  style={{ width: `${progress.total ? (progress.checked / progress.total) * 100 : 0}%` }}
                />
              </div>
              {list.estimated_cost != null && list.estimated_cost > 0 && (
                <p className="text-sm text-chef-subtle mt-2">
                  Est. grocery run: <span className="font-semibold text-chef">${list.estimated_cost.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={handleCopy} className="btn-secondary flex-1 text-sm">
              <Copy size={14} /> Copy list
            </button>
            {progress && progress.checked > 0 && (
              <button type="button" onClick={handleClearChecked} className="btn-secondary flex-1 text-sm">
                <Trash2 size={14} /> Clear checked
              </button>
            )}
          </div>

          <div className="space-y-4">
            {SUPPLY_GROUP_ORDER.map(({ id, label }) => {
              const items = grouped[id];
              if (!items.length) return null;
              return (
                <section key={id} className="card space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-chef-subtle">{label}</h2>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 min-h-[44px] py-1 border-b border-steel/60 last:border-0 ${
                          item.checked ? 'opacity-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={(e) => handleToggle(item.id, e.target.checked)}
                          className="h-5 w-5 rounded border-steel accent-chef shrink-0"
                          aria-label={`Mark ${item.name} as got it`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.checked ? 'line-through text-chef-subtle' : 'text-chef'}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-chef-subtle">
                            {item.quantity} {item.unit}
                            {item.estimated_price != null && ` · ~$${item.estimated_price.toFixed(2)}`}
                            {item.source === 'manual' && ' · added by you'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="text-chef-subtle hover:text-burgundy-600 p-2 shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-chef flex items-center gap-2">
          <Plus size={16} /> Add item
        </h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Item name"
          className="input-field w-full"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="input-field w-20"
            aria-label="Quantity"
          />
          <input
            type="text"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            placeholder="unit"
            className="input-field flex-1"
            aria-label="Unit"
          />
          <button type="button" onClick={handleAdd} disabled={!newName.trim()} className="btn-primary px-4">
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
