'use client';
import { useAuth } from '../../context/AuthContext';

export default function AccountPage() {
  const { user, tenants, currentTenant, switchTenant, platformRoles } =
    useAuth();
  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: 16 }}>
      <h2>Account</h2>
      <p>Email: {user?.email}</p>
      <h3>Tenants</h3>
      <ul>
        {tenants?.map((t) => (
          <li key={t.tenantId}>
            <strong>{t.tenantId}</strong> — role: {t.role}{' '}
            {currentTenant?.tenantId === t.tenantId ? (
              ' (current)'
            ) : (
              <button onClick={() => switchTenant(t.tenantId)}>Switch</button>
            )}
          </li>
        ))}
      </ul>
      <h3>Platform roles</h3>
      <p>{platformRoles?.join(', ') || '—'}</p>
    </main>
  );
}
