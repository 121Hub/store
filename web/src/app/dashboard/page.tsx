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
  const { accessToken, tenants, currentTenant } = useAuth();
  return (
    <h2>Current Tenant: {currentTenant?.tenantId || tenants?.[0]?.tenantId}</h2>
  );
}
