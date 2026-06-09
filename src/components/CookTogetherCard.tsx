import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChefHat } from 'lucide-react';
import { householdApi } from '@/lib/api';
import type { Household, HouseholdMember } from '@/types/platform';

export default function CookTogetherCard() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    householdApi.get().then((r) => {
      setHousehold(r.household);
      setMembers(r.members ?? []);
    }).catch(() => {});
  }, []);

  if (household) {
    return (
      <section className="card bg-stainless-100 border-steel">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-copper-50 flex items-center justify-center shrink-0">
            <Users className="text-copper-600" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-chef">{household.display_name || household.name}</h3>
            <p className="text-sm text-chef-subtle mt-1">
              {members.length} cook{members.length !== 1 ? 's' : ''} in your kitchen
            </p>
            <p className="text-xs text-chef-subtle mt-2">
              Plan meals, share pantry, and log meals together. Invite family from Settings.
            </p>
            <Link to="/cook" className="inline-flex items-center gap-1 text-sm font-medium text-copper-600 mt-3">
              <ChefHat size={16} /> Cook together tonight →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card border-dashed border-2 border-steel bg-stainless-200/50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-copper-50 flex items-center justify-center shrink-0">
          <Users className="text-copper-600" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-chef">Cook Together</h3>
          <p className="text-sm text-chef-subtle mt-1">
            Food tastes better when shared. Invite family or friends to one kitchen — shared pantry, meal plans, and cook logs.
          </p>
          <Link to="/settings" className="inline-block text-sm font-medium text-copper-600 mt-3">
            Set up your household kitchen →
          </Link>
        </div>
      </div>
    </section>
  );
}
