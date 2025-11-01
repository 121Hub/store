'use client';

import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/auth-guard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  return <h2>User email: {user?.email}</h2>;
}
