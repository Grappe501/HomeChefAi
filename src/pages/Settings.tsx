import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, BookOpen, Globe, Sparkles, Download } from 'lucide-react';
import { MARKETING_HOME } from '@/lib/siteNav';
import { useApp } from '@/hooks/useApp';
import { productJournalApi, billingApi } from '@/lib/api';
import CookTogetherSection from '@/components/CookTogetherSection';

export default function Settings() {
  const { profile, user, signOut, updateProfile } = useApp();
  const [zip, setZip] = useState((profile as { zip_code?: string })?.zip_code || '');
  const [isFounder, setIsFounder] = useState(!!profile?.is_founder);
  const [credits, setCredits] = useState<{ used: number; pool: number; remaining: number } | null>(null);

  useEffect(() => {
    billingApi.status().then((s) => {
      if (s.credits) setCredits({ used: s.credits.used, pool: s.credits.pool, remaining: s.credits.remaining });
    }).catch(() => {});
  }, []);

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

      <section className="card space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-copper-600" /> AI credits
        </h3>
        {credits ? (
          <>
            <p className="text-sm text-chef-muted">
              {credits.remaining} of {credits.pool} credits remaining this month
            </p>
            <div className="h-2 rounded-full bg-stainless-200 overflow-hidden">
              <div
                className="h-full bg-copper-500 transition-all"
                style={{ width: `${Math.min(100, (credits.used / Math.max(credits.pool, 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-chef-subtle">
              Pantry and Brain always work at zero credits.{' '}
              <a href="/legal/ai-usage.html" className="underline">AI Usage Policy</a>
            </p>
          </>
        ) : (
          <p className="text-xs text-chef-subtle">Full access during beta — credit tracking ready for billing launch.</p>
        )}
      </section>

      <CookTogetherSection />

      <section className="card space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Download size={18} className="text-chef" /> App on your phone
        </h3>
        <p className="text-xs text-chef-subtle">
          Use SousChef in the browser anytime at home-chef-ai.netlify.app — or install to your home screen for a full-screen app experience.
        </p>
        <p className="text-xs text-chef-subtle">
          <strong className="text-chef">Android / Chrome:</strong> tap Install when prompted, or Menu → Install app.
        </p>
        <p className="text-xs text-chef-subtle">
          <strong className="text-chef">iPhone:</strong> Share → Add to Home Screen.
        </p>
      </section>

      <section className="card space-y-2">
        <h3 className="font-semibold">Website</h3>
        <p className="text-xs text-chef-subtle">Platform overview, pricing, Kitchen Academy, and roadmap.</p>
        <Link to={MARKETING_HOME} className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-sm">
          <Globe size={16} /> Open SousChef website
        </Link>
      </section>

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

      <section className="card space-y-2 text-sm text-chef-subtle">
        <h3 className="font-semibold text-chef">Legal</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="/legal/terms.html" className="text-chef-muted hover:text-chef">Terms</a>
          <a href="/legal/privacy.html" className="text-chef-muted hover:text-chef">Privacy</a>
          <a href="/legal/ai-usage.html" className="text-chef-muted hover:text-chef">AI Usage</a>
          <a href="/legal/community.html" className="text-chef-muted hover:text-chef">Community</a>
        </div>
        <p className="text-xs">SousChef is operated by HomeChef AI.</p>
      </section>
    </div>
  );
}
