import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type User = { id?: string; email?: string };

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post(
          `${
            process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000'
          }/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          try {
            const payload = JSON.parse(
              atob(res.data.accessToken.split('.')[1])
            );
            setUser({ id: payload.sub, email: payload.email || '' });
          } catch (e) {
            setUser({});
          }
        }
      } catch (err) {
        // no session
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await axios.post(
      `${
        process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000'
      }/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      try {
        const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email || '' });
      } catch (e) {
        setUser({});
      }
    } else {
      throw new Error('No access token');
    }
  }

  async function logout() {
    await axios.post(
      `${
        process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000'
      }/auth/logout`,
      {},
      { withCredentials: true }
    );
    setUser(null);
    setAccessToken(null);
  }

  return { user, login, logout, accessToken, setAccessToken };
}
