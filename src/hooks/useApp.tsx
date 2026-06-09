import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { authApi, profileApi, billingApi } from '@/lib/api';
import type { Profile, User } from '@/types';
import type { UsageQuota } from '@/types/billing';

interface AppContextType {
  user: User | null;
  profile: Profile | null;
  billing: UsageQuota | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshBilling: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [billing, setBilling] = useState<UsageQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBilling = useCallback(async () => {
    if (import.meta.env.VITE_ENABLE_BILLING === 'true') {
      try {
        const data = await billingApi.status();
        setBilling(data as unknown as UsageQuota);
      } catch {
        setBilling(null);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setBilling(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u, profile: p } = await authApi.bootstrap();
      setUser({ id: session.user.id, email: session.user.email, name: (p as Profile)?.name || u.name });
      setProfile(p as unknown as Profile);
      await refreshBilling();
    } catch {
      setUser({ id: session.user.id, email: session.user.email ?? undefined });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [refreshBilling]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    const { profile: updated } = await profileApi.update(data as Record<string, unknown>);
    setProfile(updated as unknown as Profile);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setBilling(null);
  }, []);

  useEffect(() => {
    refreshProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });
    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  return (
    <AppContext.Provider value={{ user, profile, billing, loading, refreshProfile, refreshBilling, updateProfile, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
