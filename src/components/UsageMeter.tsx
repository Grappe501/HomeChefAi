import type { UsageQuota } from '@/types/billing';

export default function UsageMeter({ billing }: { billing: UsageQuota }) {
  if (billing.has_pro_access && !billing.credits) {
    return <p className="text-sm text-green-700 font-medium">Unlimited Pro access active</p>;
  }

  if (billing.credits) {
    const { used, pool, remaining } = billing.credits;
    const pct = Math.min(100, (used / Math.max(pool, 1)) * 100);
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-chef-subtle">AI credits this month</span>
          <span className="font-medium">{remaining}/{pool}</span>
        </div>
        <div className="h-2 bg-stainless-200 rounded-full">
          <div
            className={`h-full rounded-full ${pct >= 100 ? 'bg-burgundy-500' : 'bg-copper-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-chef-subtle">
          Pantry, Brain insights, and substitutions stay free at zero credits.
        </p>
      </div>
    );
  }

  const items = [
    { key: 'receipt_scans' as const, label: 'Receipt scans' },
    { key: 'meal_plans' as const, label: 'Meal plans' },
    { key: 'assistant_messages' as const, label: 'Clara messages' },
  ];

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
                className={`h-full rounded-full ${pct >= 100 ? 'bg-burgundy-500' : 'bg-chef'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
