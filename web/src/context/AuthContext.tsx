'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
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

function decodeToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  useEffect(() => {
    // try silent refresh on load
    (async () => {
      try {
        const res = await axios.post(
          `${
            process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8080'
          }/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (res.data?.accessToken) {
          setAccessTokenState(res.data.accessToken);
          const payload = decodeToken(res.data.accessToken);
          setUser({ id: payload?.sub, email: payload?.email || '' });
          axios.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${res.data.accessToken}`;
        }
      } catch (err) {
        // no session
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await axios.post(
      `${
        process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8080'
      }/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    if (res.data?.accessToken) {
      setAccessTokenState(res.data.accessToken);
      const payload = decodeToken(res.data.accessToken);
      setUser({ id: payload?.sub, email: payload?.email || '' });
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${res.data.accessToken}`;
    } else {
      throw new Error('No access token');
    }
  }

  async function logout() {
    await axios.post(
      `${
        process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8080'
      }/auth/logout`,
      {},
      { withCredentials: true }
    );
    setUser(null);
    setAccessTokenState(null);
    delete axios.defaults.headers.common['Authorization'];
  }

  function setAccessToken(token: string) {
    setAccessTokenState(token);
    const payload = decodeToken(token);
    setUser({ id: payload?.sub, email: payload?.email || '' });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return { user, accessToken, login, logout, setAccessToken };
}
