import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, BookOpen } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { productJournalApi } from '@/lib/api';
import CookTogetherSection from '@/components/CookTogetherSection';

export default function Settings() {
  const { profile, user, signOut, updateProfile } = useApp();
  const [zip, setZip] = useState((profile as { zip_code?: string })?.zip_code || '');
  const [isFounder, setIsFounder] = useState(!!profile?.is_founder);

  useEffect(() => {
    setIsFounder(!!profile?.is_founder);
    if (!profile?.is_founder) {
      productJournalApi.isFounder().then(setIsFounder).catch(() => setIsFounder(false));
    }
  }, [profile?.is_founder]);

  const saveZip = async () => {
    await updateProfile({ zip_code: zip } as never);
  };

  return (
    <div className="space-y-5">
      <h2 className="font-sans font-semibold text-xl text-chef">Settings</h2>

      <section className="card space-y-2">
        <h3 className="font-semibold">Account</h3>
        <p className="text-sm text-chef-subtle">{user?.email}</p>
        <p className="text-sm text-chef-subtle">{profile?.assistant_name} · Household of {profile?.household_size}</p>
      </section>

      {isFounder && (
        <Link to="/admin/journal" className="card flex items-center gap-3 hover:border-steel-dark transition-colors">
          <BookOpen className="text-chef-muted" size={24} />
          <div>
            <p className="font-semibold text-chef">Product Journal</p>
            <p className="text-xs text-chef-subtle">Founder observations · voice capture</p>
          </div>
        </Link>
      )}

      <CookTogetherSection />

      <section className="card space-y-2">
        <h3 className="font-semibold">Location</h3>
        <p className="text-xs text-chef-subtle">For local grocery estimates, neighbor swap, and future store recommendations.</p>
        <div className="flex gap-2">
          <input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="Zip code" className="input-field flex-1" maxLength={5} />
          <button onClick={saveZip} className="btn-secondary px-4">Save</button>
        </div>
      </section>

      <section className="card bg-stainless-200 border-steel">
        <p className="text-sm text-chef">Full access during beta — payments coming later.</p>
      </section>

      <button onClick={signOut} className="btn-secondary w-full text-red-600 border-red-200">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
