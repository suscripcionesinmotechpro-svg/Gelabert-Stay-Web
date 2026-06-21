"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

let SUPABASE_URL = 
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://aumqjpqngmhpbwytpets.supabase.co';

if (!SUPABASE_URL || SUPABASE_URL === 'undefined' || SUPABASE_URL === 'null' || !SUPABASE_URL.startsWith('http')) {
  SUPABASE_URL = 'https://aumqjpqngmhpbwytpets.supabase.co';
}
const SUPABASE_CONFIGURED = 
  SUPABASE_URL.startsWith('https://') && 
  !SUPABASE_URL.includes('your-project') && 
  !SUPABASE_URL.includes('YOUR_SUPABASE');

export interface UserProfile {
  id: string;
  role: string;
  agent_name: string;
  last_name?: string | null;
  office?: string | null;
  birthday?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) setUserProfile(data as UserProfile);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!SUPABASE_CONFIGURED) {
      return { error: 'Supabase no está configurado.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setUserProfile(null);
    if (SUPABASE_CONFIGURED) {
      await supabase.auth.signOut();
    }
  };

  const value: AuthContextType = { user, loading, signIn, signOut, userProfile, refreshProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
