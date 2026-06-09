import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Wand2, CalendarDays, Package, ChevronRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { inventoryApi, mealsApi, brainApi } from '@/lib/api';
import type { InventoryItem, MealPlan } from '@/types';
import type { BrainInsight } from '@/types/brain';
import CookTogetherCard from '@/components/CookTogetherCard';
import BrainInsightCard from '@/components/BrainInsightCard';
import SousChefMark from '@/components/SousChefMark';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { profile } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const assistantName = profile?.assistant_name || 'Clara';
  const kitchenName = profile?.household_display_name || 'Your Kitchen';

  useEffect(() => {
    inventoryApi.list().then((r) => setItems(r.items)).catch(() => {});
    mealsApi.list().then((r) => setPlans(r.plans)).catch(() => {});
    brainApi.insights().then((r) => setInsights(r.insights.slice(0, 3))).catch(() => {});
  }, []);

  const expiring = items.filter((i) => {
    if (!i.expiration_date) return false;
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  const lowStockInsight = insights.find((i) => i.memory_type === 'consumption');
  const wasteInsight = insights.find((i) => i.memory_type === 'waste');
  const activePlan = plans[0];
  const tonightMeals =
    activePlan?.plan_data?.meals?.filter((m) => m.meal_type === 'dinner').slice(0, 3) ?? [];

  const statusLines: { label: string; value: string }[] = [];
  if (lowStockInsight) {
    statusLines.push({ label: 'Running low', value: lowStockInsight.headline });
  }
  if (expiring.length > 0) {
    statusLines.push({
      label: 'Needs attention',
      value: `${expiring.length} item${expiring.length !== 1 ? 's' : ''} expiring soon`,
    });
  }
  if (activePlan) {
    const mealCount = activePlan.plan_data?.meals?.length ?? 0;
    statusLines.push({
      label: 'Meals planned',
      value: mealCount > 0 ? `${mealCount} in active plan` : activePlan.title || 'Active plan',
    });
  }
  if (wasteInsight) {
    statusLines.push({ label: 'Waste risk', value: wasteInsight.headline });
  } else if (expiring.length > 0) {
    statusLines.push({
      label: 'Waste risk',
      value: expiring.map((i) => i.name).slice(0, 2).join(', '),
    });
  }
  if (statusLines.length === 0) {
    statusLines.push({
      label: 'Kitchen status',
      value: items.length > 0 ? `${items.length} items tracked` : 'Scan a receipt to get started',
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-chef-subtle">Good {greeting()}, Chef.</p>
        <h1 className="font-sans font-semibold text-2xl text-chef tracking-tight mt-1">{kitchenName}</h1>
      </header>

      <section className="card">
        <h2 className="section-label mb-4">Kitchen Status</h2>
        <ul className="space-y-3">
          {statusLines.map(({ label, value }) => (
            <li key={label} className="flex items-start justify-between gap-4 min-h-[52px]">
              <span className="text-sm text-chef-subtle shrink-0">{label}</span>
              <span className="text-sm text-chef font-medium text-right">{value}</span>
            </li>
          ))}
        </ul>
      </section>

      {insights.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SousChefMark name={assistantName} size="sm" className="!min-h-0" />
            <Link to="/brain" className="text-link !min-h-0 text-xs">View all</Link>
          </div>
          <p className="section-label -mt-1">{assistantName}&apos;s Notes</p>
          {insights.map((insight) => (
            <BrainInsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}

      <section className="card">
        <h2 className="section-label mb-3">Tonight&apos;s Options</h2>
        {tonightMeals.length > 0 ? (
          <ul className="space-y-2">
            {tonightMeals.map((m, i) => (
              <li key={i} className="text-sm text-chef font-medium min-h-[44px] flex items-center">
                {m.name}
              </li>
            ))}
            <Link to="/meals" className="text-link mt-2">Open meal planner</Link>
          </ul>
        ) : activePlan ? (
          <div>
            <p className="text-sm text-chef font-medium">{activePlan.title}</p>
            <Link to="/calendar" className="text-link mt-2">Open kitchen calendar</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-chef-subtle">No meals planned yet.</p>
            <Link to="/meals" className="btn-secondary w-full">Plan meals</Link>
          </div>
        )}
      </section>

      <CookTogetherCard />

      <section>
        <h2 className="section-label mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/receipt" className="action-tile">
            <Camera className="text-chef" size={24} />
            <span className="font-medium text-sm">Scan Receipt</span>
          </Link>
          <Link to="/wizard" className="action-tile">
            <Wand2 className="text-chef" size={24} />
            <span className="font-medium text-sm">Pantry Wizard</span>
          </Link>
          <Link to="/meals" className="action-tile">
            <CalendarDays className="text-chef" size={24} />
            <span className="font-medium text-sm">Plan Meals</span>
          </Link>
          <Link to="/inventory" className="action-tile">
            <Package className="text-chef" size={24} />
            <span className="font-medium text-sm">Pantry ({items.length})</span>
          </Link>
        </div>
      </section>

      {expiring.length > 0 && (
        <section className="card border-burgundy-500/30 bg-burgundy-50">
          <h3 className="font-semibold text-burgundy-600 text-sm">Use Soon</h3>
          <ul className="mt-3 space-y-2">
            {expiring.map((i) => (
              <li key={i.id} className="text-sm text-chef-subtle min-h-[44px] flex items-center gap-2">
                <ChevronRight size={14} className="text-burgundy-500 shrink-0" />
                {i.name} — expires {i.expiration_date}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
