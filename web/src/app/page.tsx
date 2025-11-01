'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: 20 }}>
      <h1>Fynfloo — Multi-tenant dashboard</h1>
      {user ? (
        <div>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <p>Tenants: {user.tenants.map((t) => t.tenantId).join(', ')}</p>
          <p>
            <Link href="/dashboard">Go to dashboard</Link>
          </p>
          <Button onClick={logout}>Sign out</Button>
        </div>
      ) : (
        <div>
          <Link href="/login">Sign In</Link> |{' '}
          <Link href="/signup">Sign Up</Link>
        </div>
      )}
    </main>
  );
}
