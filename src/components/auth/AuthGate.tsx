'use client';

import * as React from 'react';
import { Sparkles, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { resetPassword, resendSignupConfirmation, signIn, signUp, type AuthFeedback } from '@/lib/supabase/auth';
import { trackBetaEvent } from '@/lib/supabase/analytics';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Vanto Coach…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

function AuthScreen() {
  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = React.useState<string | null>(null);

  const applyError = (feedback: AuthFeedback) => {
    setError(feedback.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          await trackBetaEvent({ eventName: 'signup_failed', route: '/coach', actionName: 'signup_submit', metadata: { code: error.code } });
          applyError(error);
          return;
        }
        setSuccessMessage('Password reset email sent. Check your inbox.');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        await trackBetaEvent({ eventName: 'signup_started', route: '/coach', actionName: 'signup_submit' });
        const { data, error } = await signUp({ email, password, displayName, inviteCode });
        if (error) {
          await trackBetaEvent({ eventName: 'signup_failed', route: '/coach', actionName: 'signup_submit', metadata: { code: error.code } });
          applyError(error);
          return;
        }

        await trackBetaEvent({ eventName: 'signup_succeeded', route: '/coach', actionName: 'signup_submit' });
        const needsConfirmation = !(data && typeof data === 'object' && 'session' in data && data.session);
        if (needsConfirmation) {
          setPendingConfirmationEmail(email);
          setSuccessMessage('Account created. Check your email for the confirmation link before signing in.');
        } else {
          setSuccessMessage('Account created successfully.');
        }

        setMode('signin');
        setIsLoading(false);
        return;
      }

      // signin
      const { error } = await signIn({ email, password });
      if (error) {
        applyError(error);
        return;
      }
      // AuthContext will update and re-render automatically
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail) return;

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error } = await resendSignupConfirmation(pendingConfirmationEmail);
      if (error) {
        applyError(error);
        return;
      }

      setSuccessMessage('Confirmation email sent again. Please check your inbox.');
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center mb-4 shadow-sm">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight">Vanto Coach</h1>
          <p className="text-sm text-muted-foreground mt-1">Executive Christian Life Coach</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">Setup required</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Add your <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> to enable authentication.
            </p>
          </div>
        )}

        <Card className="card-premium">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-serif">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin' && 'Sign in to your coaching journal'}
              {mode === 'signup' && 'Begin your faith-centred coaching journey'}
              {mode === 'reset' && "We'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      placeholder="Your name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="inviteCode">Invite code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter your beta invite code"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Create a strong password' : 'Your password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="pl-9 pr-10"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                  {successMessage}
                </p>
              )}

              {pendingConfirmationEmail && mode === 'signin' && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
                  <p className="text-foreground">Need a fresh confirmation email?</p>
                  <p className="mt-1 text-muted-foreground">Send another confirmation link to {pendingConfirmationEmail}.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend confirmation email'}
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {mode === 'signin' && 'Sign in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'reset' && 'Send reset link'}
              </Button>
            </form>

            <Separator className="my-5" />

            <div className="flex flex-col gap-2 text-center text-sm">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Don't have an account? <span className="text-primary font-medium">Sign up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(null); }}
                    className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {(mode === 'signup' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already have an account? <span className="text-primary font-medium">Sign in</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
          <BookOpen className="h-3 w-3" />
          Your words are private, secure, and yours alone.
        </p>
      </div>
    </div>
  );
}
