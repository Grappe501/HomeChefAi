import { Check, X } from 'lucide-react';
import type { InventoryDelta, PendingInventoryDelta, PendingUsageConfirm } from '@/types/inventorySteward';

interface InventoryDeltaConfirmCardProps {
  pending: PendingInventoryDelta;
  saving?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function InventoryDeltaConfirmCard({
  pending,
  saving,
  onConfirm,
  onDismiss,
}: InventoryDeltaConfirmCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-3 space-y-2">
      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Update pantry?</p>
      <ul className="text-sm text-chef space-y-1">
        {pending.deltas.map((d, i) => (
          <li key={i}>
            {formatDelta(d)}
          </li>
        ))}
      </ul>
      {pending.summary && <p className="text-xs text-chef-subtle">{pending.summary}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onConfirm} disabled={saving} className="btn-primary flex-1 min-h-[44px] text-sm">
          <Check size={16} /> {saving ? 'Updating…' : 'Confirm pantry update'}
        </button>
        <button type="button" onClick={onDismiss} disabled={saving} className="btn-secondary min-h-[44px] px-4" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function formatDelta(d: InventoryDelta): string {
  const qty = d.quantity ?? 1;
  const unit = d.unit ? ` ${d.unit}` : '';
  switch (d.action) {
    case 'add':
      return `Add ${qty}${unit} ${d.name}`;
    case 'subtract':
      return `Use ${qty}${unit} ${d.name}`;
    case 'set':
      return `Set ${d.name} to ${qty}${unit}`;
    case 'remove':
      return `Remove ${d.name}`;
    default:
      return d.name;
  }
}

interface UsageConfirmCardProps {
  pending: PendingUsageConfirm;
  saving?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function UsageConfirmCard({ pending, saving, onConfirm, onDismiss }: UsageConfirmCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-steel bg-stainless-50 px-3 py-3 space-y-2">
      <p className="text-xs font-semibold text-chef-muted uppercase tracking-wide">Deduct from pantry?</p>
      {pending.meal_label && (
        <p className="text-sm font-medium text-chef">{pending.meal_label}</p>
      )}
      <ul className="text-sm text-chef-subtle space-y-0.5">
        {pending.items.map((item, i) => (
          <li key={i}>
            {item.quantity} {item.unit} {item.name}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onConfirm} disabled={saving} className="btn-primary flex-1 min-h-[44px] text-sm">
          <Check size={16} /> {saving ? 'Updating…' : 'Yes, update pantry'}
        </button>
        <button type="button" onClick={onDismiss} disabled={saving} className="btn-secondary min-h-[44px] px-4" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
