import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Wand2, CalendarDays, Package, BookOpen, Sparkles, PartyPopper, ChefHat, ShoppingCart } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { inventoryApi, mealsApi, brainApi, supplyApi, learningApi } from '@/lib/api';
import type { InventoryItem, MealPlan } from '@/types';
import type { BrainInsight } from '@/types/brain';
import type { KitchenPrediction } from '@/types/kitchenPredictions';
import type { RunningSupplyList } from '@/types/supplyList';
import type { BehaviorProfile, KitchenRhythmNudge } from '@/types/behaviorLearning';
import type { SkillGrowthNudge, SkillProfile } from '@/types/skillLearning';
import type { IdentityNudge, IdentityProfile } from '@/types/identityLearning';
import { supplyProgress } from '@/lib/supplyListOps';
import CookTogetherCard from '@/components/CookTogetherCard';
import BrainInsightCard from '@/components/BrainInsightCard';
import ProactiveKitchenCards from '@/components/ProactiveKitchenCards';
import KitchenRhythmCard from '@/components/KitchenRhythmCard';
import SkillGrowthCard from '@/components/SkillGrowthCard';
import HouseholdIdentityCard from '@/components/HouseholdIdentityCard';
import SousChefMark from '@/components/SousChefMark';
import { assistantFirstName } from '@/lib/assistant';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

interface StatusItem {
  text: string;
  urgent?: boolean;
}

function buildStatus(
  items: InventoryItem[],
  expiring: InventoryItem[],
  insights: BrainInsight[],
  activePlan: MealPlan | undefined,
): StatusItem[] {
  const lines: StatusItem[] = [];
  const lowStock = insights.find((i) => i.memory_type === 'consumption');
  const waste = insights.find((i) => i.memory_type === 'waste');

  if (lowStock) {
    lines.push({ text: lowStock.headline.replace(/^Chef,?\s*/i, '') });
  }
  if (expiring.length > 0) {
    lines.push({
      text: `${expiring.length} ingredient${expiring.length !== 1 ? 's' : ''} need attention`,
      urgent: true,
    });
  }
  if (waste) {
    lines.push({ text: waste.headline.replace(/^Chef,?\s*/i, ''), urgent: true });
  } else if (expiring.length > 0) {
    lines.push({
      text: `Waste risk: ${expiring.map((i) => i.name).slice(0, 2).join(', ')}`,
      urgent: true,
    });
  }
  if (activePlan) {
    const n = activePlan.plan_data?.meals?.length ?? 0;
    lines.push({ text: n > 0 ? `${n} meals planned` : 'Active meal plan' });
  }
  if (lines.length === 0) {
    lines.push({
      text: items.length > 0 ? `${items.length} items in pantry` : 'Pantry empty — scan a receipt to start',
    });
  }
  return lines;
}

function nextAction(
  items: InventoryItem[],
  expiring: InventoryItem[],
  insights: BrainInsight[],
): { label: string; to: string } {
  if (items.length === 0) return { label: 'Scan your first receipt', to: '/receipt' };
  if (expiring.length > 0) return { label: 'Review items to use soon', to: '/inventory' };
  if (insights.length === 0) return { label: 'Log a meal — help Clara learn', to: '/cook' };
  return { label: 'Ask Clara what to cook', to: '/assistant' };
}

export default function Dashboard() {
  const { profile } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [predictions, setPredictions] = useState<KitchenPrediction[]>([]);
  const [supplyList, setSupplyList] = useState<RunningSupplyList | null>(null);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [behaviorProfile, setBehaviorProfile] = useState<BehaviorProfile | null>(null);
  const [rhythmNudges, setRhythmNudges] = useState<KitchenRhythmNudge[]>([]);
  const [rhythmLoading, setRhythmLoading] = useState(true);
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [skillNudges, setSkillNudges] = useState<SkillGrowthNudge[]>([]);
  const [skillLoading, setSkillLoading] = useState(true);
  const [identityProfile, setIdentityProfile] = useState<IdentityProfile | null>(null);
  const [identityNudges, setIdentityNudges] = useState<IdentityNudge[]>([]);
  const [identityLoading, setIdentityLoading] = useState(true);
  const assistantName = assistantFirstName(profile?.assistant_name);
  const kitchenName = profile?.household_display_name || 'Your Kitchen';

  useEffect(() => {
    inventoryApi.list().then((r) => setItems(r.items)).catch(() => {});
    mealsApi.list().then((r) => setPlans(r.plans)).catch(() => {});
    brainApi.insights().then((r) => setInsights(r.insights.slice(0, 3))).catch(() => {});
    supplyApi.get().then((r) => setSupplyList(r.list)).catch(() => {});
    brainApi
      .predictions()
      .then((r) => setPredictions(r.predictions))
      .catch(() => {})
      .finally(() => setPredictionsLoading(false));
    learningApi
      .rhythm()
      .then((r) => {
        setBehaviorProfile(r.behavior_profile);
        setRhythmNudges(r.nudges);
      })
      .catch(() => {})
      .finally(() => setRhythmLoading(false));
    learningApi
      .skills()
      .then((r) => {
        setSkillProfile(r.skill_profile);
        setSkillNudges(r.nudges);
      })
      .catch(() => {})
      .finally(() => setSkillLoading(false));
    learningApi
      .identity()
      .then((r) => {
        setIdentityProfile(r.identity_profile);
        setIdentityNudges(r.nudges);
      })
      .catch(() => {})
      .finally(() => setIdentityLoading(false));
  }, []);

  const expiring = items.filter((i) => {
    if (!i.expiration_date) return false;
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  const activePlan = plans[0];
  const tonightMeals =
    activePlan?.plan_data?.meals?.filter((m) => m.meal_type === 'dinner').slice(0, 3) ?? [];
  const statusItems = buildStatus(items, expiring, insights, activePlan);
  const action = nextAction(items, expiring, insights);

  const supplyStats = supplyList?.items.length ? supplyProgress(supplyList.items) : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-chef-subtle">Good {greeting()}, Chef.</p>
        <h1 className="font-sans font-semibold text-2xl text-chef tracking-tight mt-1">{kitchenName}</h1>
      </header>

      <section className="card">
        <h2 className="section-label mb-4">Kitchen Status</h2>
        <ul className="space-y-3">
          {statusItems.map((item, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 text-sm min-h-[44px] ${
                item.urgent ? 'text-burgundy-600 font-medium' : 'text-chef'
              }`}
            >
              <span className="text-chef-subtle mt-0.5 shrink-0">•</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <Link to={action.to} className="btn-primary w-full mt-5">
          {action.label}
        </Link>
      </section>

      <ProactiveKitchenCards predictions={predictions} loading={predictionsLoading} />

      <KitchenRhythmCard profile={behaviorProfile} nudges={rhythmNudges} loading={rhythmLoading} />

      <SkillGrowthCard profile={skillProfile} nudges={skillNudges} loading={skillLoading} />

      <HouseholdIdentityCard profile={identityProfile} nudges={identityNudges} loading={identityLoading} />

      <section className="card border-copper-200/80 bg-copper-50/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-copper-700">Kitchen Supply List</p>
            {supplyStats && supplyStats.total > 0 ? (
              <>
                <p className="text-sm text-chef mt-1 font-medium">
                  {supplyStats.total - supplyStats.checked} items to buy
                  {supplyList?.plan_title && ` · ${supplyList.plan_title}`}
                </p>
                {supplyList?.estimated_cost != null && supplyList.estimated_cost > 0 && (
                  <p className="text-xs text-chef-subtle mt-0.5">Est. ~${supplyList.estimated_cost.toFixed(2)}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-chef-subtle mt-1">Plan meals — your grocery list builds automatically.</p>
            )}
          </div>
          <ShoppingCart className="text-copper-600 shrink-0" size={22} />
        </div>
        <Link to="/shop" className="btn-primary w-full mt-4 text-sm">
          {supplyStats && supplyStats.total > 0 ? 'Open shopping list' : 'Start supply list'}
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SousChefMark name={assistantName} size="sm" className="!min-h-0" />
            <p className="section-label mt-1">What {assistantName} Has Learned</p>
          </div>
          <Link to="/brain" className="text-link !min-h-0 text-xs">View all</Link>
        </div>
        {insights.length > 0 ? (
          insights.map((insight) => (
            <BrainInsightCard key={insight.id} insight={insight} />
          ))
        ) : (
          <div className="card">
            <p className="text-sm text-chef-subtle leading-relaxed">
              {assistantName} is still learning your kitchen. Scan receipts and log meals — patterns appear after a few shops.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/receipt" className="btn-secondary text-sm flex-1 min-w-[140px]">Scan receipt</Link>
              <Link to="/cook" className="btn-secondary text-sm flex-1 min-w-[140px]">Log a meal</Link>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="section-label mb-3">Tonight&apos;s Options</h2>
        {tonightMeals.length > 0 ? (
          <ul className="space-y-2">
            {tonightMeals.map((m, i) => (
              <li key={i} className="text-sm text-chef font-medium min-h-[44px] flex items-center gap-2">
                <span className="text-chef-subtle">•</span>
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
            <p className="text-sm text-chef-subtle">Nothing planned for tonight.</p>
            <Link to="/meals" className="btn-secondary w-full">Plan meals</Link>
          </div>
        )}
      </section>

      <section className="card bg-copper-50/30 border-copper-200/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-copper-700">Kitchen Academy</p>
            <p className="text-sm text-chef mt-1 leading-relaxed">
              History, origins, and teach-me moments — the same depth behind Why this? on your meal cards.
            </p>
          </div>
          <BookOpen className="text-copper-600 shrink-0" size={22} />
        </div>
        <Link to="/learn" className="btn-secondary w-full mt-4 text-sm">Browse lessons</Link>
      </section>

      <CookTogetherCard />

      <section>
        <h2 className="section-label mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/receipt" className="action-tile">
            <Camera className="text-chef" size={24} />
            <span className="font-medium text-sm">Scan Receipt</span>
          </Link>
          <Link to="/shop" className="action-tile">
            <ShoppingCart className="text-chef" size={24} />
            <span className="font-medium text-sm">Supply List</span>
          </Link>
          <Link to="/pantry-scan" className="action-tile">
            <Sparkles className="text-chef" size={24} />
            <span className="font-medium text-sm">Pantry Photo</span>
          </Link>
          <Link to="/hosting" className="action-tile">
            <PartyPopper className="text-chef" size={24} />
            <span className="font-medium text-sm">Hosting</span>
          </Link>
          <Link to="/wizard" className="action-tile">
            <Wand2 className="text-chef" size={24} />
            <span className="font-medium text-sm">Pantry Wizard</span>
          </Link>
          <Link to="/meals" className="action-tile">
            <CalendarDays className="text-chef" size={24} />
            <span className="font-medium text-sm">Plan Meals</span>
          </Link>
          <Link to="/recipes" className="action-tile">
            <ChefHat className="text-chef" size={24} />
            <span className="font-medium text-sm">Recipe Ideas</span>
          </Link>
          <Link to="/inventory" className="action-tile">
            <Package className="text-chef" size={24} />
            <span className="font-medium text-sm">Inventory ({items.length})</span>
          </Link>
          <Link to="/learn" className="action-tile col-span-2">
            <BookOpen className="text-chef" size={24} />
            <span className="font-medium text-sm">Kitchen Academy</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
