'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'invalid'>(
    'loading'
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = sp.get('token');
    const uid = sp.get('uid');

    if (!token || !uid) {
      setStatus('invalid');
      setMessage('Invalid confirmation link.');
      return;
    }

    axios
      .get(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        }/auth/confirm-email`,
        {
          params: { token, uid },
          headers: { Accept: 'application/json' },
        }
      )
      .then((res) => {
        if (res.data?.ok) {
          router.push('/confirmed');
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Email confirmation failed');
        }
      })
      .catch((err) => {
        setStatus('error');
        const detail = err.response?.data?.message || err.message;
        setMessage(`We couldn’t confirm your email. ${detail}`);
      });
  }, [sp, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-none shadow-md text-center">
        <CardHeader>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <CardTitle className="text-xl font-semibold">
                Verifying your email
              </CardTitle>
            </div>
          )}

          {status !== 'loading' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <CardTitle className="text-xl font-semibold">
                Email confirmation failed
              </CardTitle>
            </div>
          )}
        </CardHeader>

        {status !== 'loading' && (
          <CardContent className="space-y-6 text-muted-foreground">
            <p>{message}</p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
