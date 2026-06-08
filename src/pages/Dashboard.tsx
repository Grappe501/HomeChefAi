import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Wand2, CalendarDays, Package, Sparkles } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { inventoryApi, mealsApi } from '@/lib/api';
import { getLevelInfo, speak } from '@/lib/utils';
import { GAMIFICATION_LEVELS } from '@/types';
import type { InventoryItem, MealPlan } from '@/types';

export default function Dashboard() {
  const { profile, user } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const levelInfo = profile ? getLevelInfo(profile.gamification_xp, profile.gamification_level) : null;
  const currentQuest = GAMIFICATION_LEVELS.find((l) => l.level === (profile?.gamification_level || 1));

  useEffect(() => {
    inventoryApi.list().then((r) => setItems(r.items)).catch(() => {});
    mealsApi.list().then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile && items.length === 0) {
      speak(`Welcome back! Start by scanning your first grocery receipt, or tap through the pantry wizard.`);
    }
  }, [profile, items.length]);

  const expiring = items.filter((i) => {
    if (!i.expiration_date) return false;
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  const memory = profile?.last_meal_memory as { meal?: string; date?: string } | undefined;

  return (
    <div className="space-y-5">
      <section className="card bg-gradient-to-br from-chef-500 to-chef-600 text-white">
        <p className="text-chef-100 text-sm">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name || 'Chef'}!</p>
        <h2 className="font-display text-xl mt-1">What's cooking today?</h2>
        {currentQuest && (
          <div className="mt-3 bg-white/20 rounded-xl p-3">
            <p className="text-xs text-chef-100 flex items-center gap-1"><Sparkles size={12} /> Level {profile?.gamification_level} Quest</p>
            <p className="font-medium">{currentQuest.quest}</p>
          </div>
        )}
      </section>

      {memory?.meal && (
        <section className="card border-l-4 border-chef-400">
          <p className="text-sm text-sage-500">Memory</p>
          <p className="font-medium">Last cooked: {memory.meal}</p>
          <p className="text-xs text-sage-400 mt-1">I'll suggest similar meals you haven't had in a while.</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link to="/receipt" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors">
          <Camera className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Scan Receipt</span>
        </Link>
        <Link to="/wizard" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors">
          <Wand2 className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Pantry Wizard</span>
        </Link>
        <Link to="/meals" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors">
          <CalendarDays className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Plan Meals</span>
        </Link>
        <Link to="/inventory" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors">
          <Package className="text-chef-500" size={28} />
          <span className="font-medium text-sm">View Pantry ({items.length})</span>
        </Link>
      </section>

      {expiring.length > 0 && (
        <section className="card border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-800">Use Soon</h3>
          <ul className="mt-2 space-y-1">
            {expiring.map((i) => (
              <li key={i.id} className="text-sm text-amber-700">{i.name} — expires {i.expiration_date}</li>
            ))}
          </ul>
        </section>
      )}

      {plans[0] && (
        <section className="card">
          <h3 className="font-semibold">Active Meal Plan</h3>
          <p className="text-sm text-sage-500 mt-1">{plans[0].title}</p>
          <div className="mt-3 space-y-2">
            {plans[0].plan_data?.meals?.slice(0, 3).map((m, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>Day {m.day} — {m.meal_type}</span>
                <span className="font-medium">{m.name}</span>
              </div>
            ))}
          </div>
          <Link to="/meals" className="text-chef-600 text-sm font-medium mt-2 inline-block">View full plan →</Link>
        </section>
      )}

      {levelInfo && (
        <section className="card">
          <div className="flex justify-between text-sm">
            <span>XP: {profile?.gamification_xp}</span>
            <span>Next level: {levelInfo.nextXp} XP</span>
          </div>
          <div className="w-full h-2 bg-sage-100 rounded-full mt-2">
            <div className="h-full bg-chef-400 rounded-full" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </section>
      )}
    </div>
  );
}
