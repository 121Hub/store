'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: 20 }}>
      <h1>Welcome to the Store App</h1>
      {user ? (
        <div>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <button onClick={logout}>Sign out</button>
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
