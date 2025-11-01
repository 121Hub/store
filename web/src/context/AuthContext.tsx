'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../types/user';
import { AuthContextValue } from '../types/authcontext';
import { Tenant } from '@/types/tenant';

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

function decode(token: string | null) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformRoles, setPlatformRoles] = useState<string[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  useEffect(() => {
    // try silent refresh on load
    (async () => {
      try {
        const res = await axios.post(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const token = res.data?.accessToken;
        if (token) {
          setAccessTokenState(token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const payload = decode(token);
          setUser({ id: payload?.sub, email: payload?.email });
          setTenants(payload?.tenants || []);
          setPlatformRoles(payload?.roles || []);
          setCurrentTenantId((payload?.tenants || [])[0]?.tenantId || null);
        }
      } catch (err) {
        // no session
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await axios.post(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      }/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    const token = res.data?.accessToken;
    if (!token) throw new Error('No token');
    setAccessTokenState(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const payload = decode(token);
    setUser({ id: payload?.sub, email: payload?.email });
    setTenants(payload?.tenants || []);
    setPlatformRoles(payload?.roles || []);
    setCurrentTenantId((payload?.tenants || [])[0]?.tenantId || null);
  }

  async function logout() {
    try {
      await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        }/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch {}
    setUser(null);
    setAccessTokenState(null);
    setTenants([]);
    setPlatformRoles([]);
    setCurrentTenantId(null);
    delete axios.defaults.headers.common['Authorization'];
  }

  function setAccessToken(token: string) {
    setAccessTokenState(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const payload = decode(token);
    setUser({ id: payload?.sub, email: payload?.email });
    setTenants(payload?.tenants || []);
    setPlatformRoles(payload?.roles || []);
    setCurrentTenantId((payload?.tenants || [])[0]?.tenantId || null);
  }

  function switchTenant(tenantId: string) {
    const t = tenants.find((x) => x.tenantId === tenantId) || null;
    setCurrentTenantId(t?.tenantId || null);
    if (t) localStorage.setItem('fynflo.currentTenant', t.tenantId);
  }

  const currentTenant =
    tenants.find((x) => x.tenantId === currentTenantId) || tenants[0] || null;

  return {
    user,
    loading,
    accessToken,
    tenants,
    platformRoles,
    currentTenant,
    login,
    logout,
    setAccessToken,
    switchTenant,
  };
}
