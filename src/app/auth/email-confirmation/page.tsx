'use client';

import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function EmailConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="glass p-8 rounded-2xl brand-border max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold heading-gradient">Check Your Email</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a verification link to your email address. Please click it to confirm your account.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Check your spam/junk folder if you don't see the email in your inbox.</span>
        </div>
        <Link
          href="/auth/login"
          className="btn-gradient text-white px-5 py-2.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
        >
          Go to Login
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}