'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/signin');
  }, [user, loading]);
  if (loading || !user) return <div>Checking auth...</div>;
  return <>{children}</>;
}
