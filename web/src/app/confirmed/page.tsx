'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function EmailConfirmedPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-none shadow-md text-center">
        <CardHeader className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <CardTitle className="text-xl font-semibold">
            Email Confirmed
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-muted-foreground">
          <p>
            Your email address has been successfully confirmed. You can now sign
            in to your account and start using the platform.
          </p>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
