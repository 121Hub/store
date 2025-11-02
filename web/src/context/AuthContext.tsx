'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { User } from '../types/user';
import { AuthContextValue } from '../types/authcontext';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useProvideAuth();
  return (
    <AuthContext.Provider value={auth as AuthContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * On load, call /auth/me to get user info.
   * Access token is sent automatically via cookie.
   */
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        setUser(res.data);
      } catch {
        try {
          // Try refreshing once
          await axiosClient.post('/auth/refresh');
          const res = await axiosClient.get('/auth/me');
          setUser(res.data);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    await axiosClient.post('/auth/login', { email, password });
    const res = await axiosClient.get('/auth/me');
    setUser(res.data);
  }

  async function logout() {
    await axiosClient.post('/auth/logout');
    setUser(null);
  }

  return {
    user,
    loading,
    login,
    logout,
  };
}
