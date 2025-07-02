"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, initialUser = null }: { children: ReactNode, initialUser?: User | null }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const supabase = createClient();

  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
        setIsLoading(false);
      })
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // No need to set isLoading here as initial load is handled
      // and subsequent changes might not need a global loading state.
      // Or, if desired:
      // if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      //   setIsLoading(false);
      // }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase, initialUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};