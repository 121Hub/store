'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user === null) {
      // redirect to signin
      router.push('/signin');
    }
  }, [user]);
  if (!user) return <div>Redirecting to sign in...</div>;
  return <>{children}</>;
}
