import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Wand2, CalendarDays, Package, Sparkles, Brain } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { inventoryApi, mealsApi, suggestionsApi } from '@/lib/api';
import { getLevelInfo } from '@/lib/utils';
import { GAMIFICATION_LEVELS } from '@/types';
import type { InventoryItem, MealPlan } from '@/types';

export default function Dashboard() {
  const { profile, user } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [suggestions, setSuggestions] = useState<{ title: string; message: string }[]>([]);
  const levelInfo = profile ? getLevelInfo(profile.gamification_xp, profile.gamification_level) : null;
  const currentQuest = GAMIFICATION_LEVELS.find((l) => l.level === (profile?.gamification_level || 1));

  useEffect(() => {
    inventoryApi.list().then((r) => {
      setItems(r.items);
      setTotalValue((r as { total_value?: number }).total_value ?? 0);
    }).catch(() => {});
    mealsApi.list().then((r) => setPlans(r.plans)).catch(() => {});
    suggestionsApi.list().then((r) => setSuggestions(r.suggestions)).catch(() => {});
  }, []);

  const expiring = items.filter((i) => {
    if (!i.expiration_date) return false;
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  return (
    <div className="space-y-5">
      <section className="card bg-gradient-to-br from-chef-500 to-chef-600 text-white">
        <p className="text-chef-100 text-sm">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name || 'Chef'}!</p>
        <h2 className="font-display text-xl mt-1">What's cooking today?</h2>
        {items.length > 0 && (
          <p className="text-chef-100 text-sm mt-2">Pantry value: ${totalValue.toFixed(2)} · {items.length} items</p>
        )}
        {currentQuest && (
          <div className="mt-3 bg-white/20 rounded-xl p-3">
            <p className="text-xs text-chef-100 flex items-center gap-1"><Sparkles size={12} /> Level {profile?.gamification_level} Quest</p>
            <p className="font-medium">{currentQuest.quest}</p>
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-sage-600 flex items-center gap-1"><Brain size={16} /> Sous Chef says</h3>
          {suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="card border-l-4 border-chef-400 py-3">
              <p className="font-medium text-chef-800">{s.title}</p>
              <p className="text-sm text-sage-600 mt-1">{s.message}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link to="/receipt" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors py-4">
          <Camera className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Scan Receipt</span>
        </Link>
        <Link to="/wizard" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors py-4">
          <Wand2 className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Pantry Wizard</span>
        </Link>
        <Link to="/meals" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors py-4">
          <CalendarDays className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Plan Meals</span>
        </Link>
        <Link to="/inventory" className="card flex flex-col items-center gap-2 hover:border-chef-300 transition-colors py-4">
          <Package className="text-chef-500" size={28} />
          <span className="font-medium text-sm">Pantry ({items.length})</span>
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
          <Link to="/calendar" className="text-sm text-amber-800 font-medium mt-2 inline-block">View calendar →</Link>
        </section>
      )}

      {plans[0] && (
        <section className="card">
          <h3 className="font-semibold">Active Meal Plan</h3>
          <p className="text-sm text-sage-500 mt-1">{plans[0].title}</p>
          <Link to="/calendar" className="text-chef-600 text-sm font-medium mt-2 inline-block">Open kitchen calendar →</Link>
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
