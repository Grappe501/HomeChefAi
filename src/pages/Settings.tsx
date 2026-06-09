import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import CookTogetherSection from '@/components/CookTogetherSection';

export default function Settings() {
  const { profile, user, signOut, updateProfile } = useApp();
  const [zip, setZip] = useState((profile as { zip_code?: string })?.zip_code || '');

  const saveZip = async () => {
    await updateProfile({ zip_code: zip } as never);
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl text-chef-800">Settings</h2>

      <section className="card space-y-2">
        <h3 className="font-semibold">Account</h3>
        <p className="text-sm text-sage-600">{user?.email}</p>
        <p className="text-sm text-sage-600">{profile?.assistant_name} · Household of {profile?.household_size}</p>
      </section>

      <CookTogetherSection />

      <section className="card space-y-2">
        <h3 className="font-semibold">Location</h3>
        <p className="text-xs text-sage-500">For local grocery estimates, neighbor swap, and future store recommendations.</p>
        <div className="flex gap-2">
          <input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="Zip code" className="input-field flex-1" maxLength={5} />
          <button onClick={saveZip} className="btn-secondary px-4">Save</button>
        </div>
      </section>

      <section className="card bg-chef-50 border-chef-100">
        <p className="text-sm text-chef-800">Full access during beta — payments coming later.</p>
      </section>

      <button onClick={signOut} className="btn-secondary w-full text-red-600 border-red-200">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
