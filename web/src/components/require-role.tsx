'use client';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { platformRoles } = useAuth();
  const ok = roles.some((r) => platformRoles.includes(r));
  if (!ok) {
    return <div>Access Denied</div>;
  }
  return <>{children}</>;
}
