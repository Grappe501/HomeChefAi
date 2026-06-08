import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, profileApi, setUserId, getStoredUserId } from '@/lib/api';
import type { Profile, User } from '@/types';

interface AppContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  initAuth: (name?: string, email?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const storedId = getStoredUserId();
    if (!storedId) {
      setLoading(false);
      return;
    }
    try {
      const { user, profile } = await authApi.login({ user_id: storedId });
      setUser(user as User);
      setProfile(profile as unknown as Profile);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const initAuth = useCallback(async (name?: string, email?: string) => {
    setLoading(true);
    try {
      const { user, profile } = await authApi.login({ name, email });
      setUserId(user.id);
      setUser(user as User);
      setProfile(profile as unknown as Profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    const { profile: updated } = await profileApi.update(data as Record<string, unknown>);
    setProfile(updated as unknown as Profile);
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AppContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile, initAuth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
