import type { UsageQuota } from '@/types/billing';

export default function UsageMeter({ billing }: { billing: UsageQuota }) {
  const items = [
    { key: 'receipt_scans', label: 'Receipt scans' },
    { key: 'meal_plans', label: 'Meal plans' },
    { key: 'assistant_messages', label: 'Assistant messages' },
  ] as const;

  if (billing.has_pro_access) {
    return <p className="text-sm text-green-700 font-medium">Unlimited Pro access active</p>;
  }

  return (
    <div className="space-y-3">
      {items.map(({ key, label }) => {
        const used = billing[key] ?? 0;
        const limit = billing.limits[key];
        const pct = Math.min(100, (used / limit) * 100);
        return (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-chef-subtle">{label}</span>
              <span className="font-medium">{used}/{limit}</span>
            </div>
            <div className="h-2 bg-stainless-200 rounded-full">
              <div
                className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : 'bg-copper-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
