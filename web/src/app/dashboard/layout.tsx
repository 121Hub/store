import React from 'react';
import Link from 'next/link';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link href="/">Home</Link> | <Link href="/dashboard">Dashboard</Link> |{' '}
        <Link href="/account">Account</Link>
      </header>
      <div>{children}</div>
    </div>
  );
}
