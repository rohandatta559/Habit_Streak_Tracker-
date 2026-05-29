import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseEnabled, supabase } from '@/lib/supabase';
import { getItem, removeItem, setItem } from '@/lib/storage';

type AuthMode = 'local' | 'cloud';

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userName: string;
  userId: string;
  authMode: AuthMode;
  login: (name: string, email?: string, password?: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

type LocalAuthRecord = {
  userName: string;
  userId: string;
};

const AUTH_KEY = 'habit.auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getFallbackUserId(name: string) {
  return `local-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function loadAuth() {
      try {
        const raw = await getItem(AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalAuthRecord;
          setUserName(parsed.userName ?? '');
          setUserId(parsed.userId ?? '');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();
  }, []);

  async function writeLocalAuth(record: LocalAuthRecord) {
    await setItem(AUTH_KEY, JSON.stringify(record));
    setUserName(record.userName);
    setUserId(record.userId);
  }

  async function login(name: string, email?: string, password?: string) {
    const trimmed = name.trim();

    if (isSupabaseEnabled && supabase && email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }

      const cloudName = (data.user.user_metadata?.name as string) || trimmed || email.split('@')[0];
      await writeLocalAuth({
        userName: cloudName,
        userId: data.user.id,
      });
      return {};
    }

    if (!trimmed) {
      return { error: 'Please enter your name.' };
    }

    await writeLocalAuth({
      userName: trimmed,
      userId: getFallbackUserId(trimmed),
    });
    return {};
  }

  async function signUp(name: string, email: string, password: string) {
    if (!isSupabaseEnabled || !supabase) {
      return { error: 'Cloud auth not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      await writeLocalAuth({
        userName: name.trim() || email.split('@')[0],
        userId: data.user.id,
      });
    }

    return {};
  }

  async function logout() {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut();
    }
    await removeItem(AUTH_KEY);
    setUserName('');
    setUserId('');
  }

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(userName && userId),
      userName,
      userId,
      authMode: isSupabaseEnabled ? 'cloud' : 'local',
      login,
      signUp,
      logout,
    }),
    [isLoading, userName, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
