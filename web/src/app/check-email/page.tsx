'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function CheckEmail() {
  const handleOpenInbox = () => {
    // Try to guess the provider based on common domains
    const email = localStorage.getItem('pendingEmail'); // optional if you saved it after signup
    let url = 'https://mail.google.com'; // default fallback

    if (email) {
      const domain = email.split('@')[1]?.toLowerCase() || '';
      if (domain.includes('gmail.com')) url = 'https://mail.google.com';
      else if (domain.includes('outlook.com') || domain.includes('hotmail.com'))
        url = 'https://outlook.live.com/mail';
      else if (domain.includes('yahoo.com')) url = 'https://mail.yahoo.com';
      else if (domain.includes('icloud.com'))
        url = 'https://www.icloud.com/mail';
    }

    window.open(url, '_blank');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-none shadow-md">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="mb-1 text-2xl font-semibold">
              Check your email
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              We’ve sent a confirmation link to your email address. Please open
              your inbox and click the link to verify your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <Button
            variant="default"
            className="w-full"
            onClick={handleOpenInbox}
          >
            Open Email Inbox
          </Button>

          <Button variant="outline" className="w-full" asChild>
            <a href="/login">Back to Login</a>
          </Button>

          <div className="text-sm text-muted-foreground">
            Didn’t get the mail?
            <br />
            <span className="text-muted-foreground/70">
              (Resend option coming soon)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
