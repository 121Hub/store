'use client';
import { useAuth } from '../../context/AuthContext';

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: 16 }}>
      <h2>Account</h2>
      <p>Email: {user?.email}</p>
      <h3>Tenants</h3>
      <ul>
        {user?.tenants?.map((t) => (
          <li key={t.tenantId}>
            <strong>{t.tenantId}</strong> — role: {t.role}{' '}
          </li>
        ))}
      </ul>
      <h3>Platform roles</h3>
      <p>{user?.platformRoles?.join(', ') || '—'}</p>
    </main>
  );
}
