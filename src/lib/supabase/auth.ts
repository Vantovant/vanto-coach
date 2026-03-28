/**
 * Vanto Coach — Auth Service
 *
 * Thin wrappers around Supabase auth.
 * All auth logic goes here — not in components.
 */

import { createClient } from './client';
import { captureMessage } from '@/lib/monitoring';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpInput extends AuthCredentials {
  displayName?: string;
}

export interface AuthFeedback {
  title: string;
  message: string;
  code: string;
}

export interface AuthActionResult<T = unknown> {
  data: T | null;
  error: AuthFeedback | null;
}

function getAuthErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = 'code' in error ? error.code : null;
    const errorCode = 'error_code' in error ? error.error_code : null;

    if (typeof errorCode === 'string' && errorCode.trim() !== '') {
      return errorCode;
    }

    if (typeof code === 'string' && code.trim() !== '') {
      return code;
    }
  }

  return 'unknown_auth_error';
}

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function mapAuthError(error: unknown, context: string): AuthFeedback {
  const code = getAuthErrorCode(error);
  const rawMessage = getAuthErrorMessage(error).toLowerCase();

  captureMessage(`auth failure: ${code}`, 'warning', {
    context,
    authCode: code,
    rawMessage,
  });

  if (code === 'email_address_invalid' || rawMessage.includes('invalid email')) {
    return {
      code,
      title: 'Enter a valid email',
      message: 'Please use a real email address in a valid format.',
    };
  }

  if (
    code.includes('rate') ||
    rawMessage.includes('rate limit') ||
    rawMessage.includes('too many requests') ||
    rawMessage.includes('throttl')
  ) {
    return {
      code,
      title: 'Too many attempts',
      message: 'Please wait a bit before trying again or requesting another email.',
    };
  }

  if (
    code === 'user_already_exists' ||
    rawMessage.includes('already registered') ||
    rawMessage.includes('already been registered') ||
    rawMessage.includes('user already registered')
  ) {
    return {
      code,
      title: 'Account already exists',
      message: 'That email is already registered. Try signing in or resetting your password.',
    };
  }

  if (
    code === 'invalid_credentials' ||
    rawMessage.includes('invalid login credentials')
  ) {
    return {
      code,
      title: 'Sign-in failed',
      message: 'Your email or password is incorrect.',
    };
  }

  return {
    code,
    title: 'Authentication failed',
    message: 'We could not complete that request right now. Please try again.',
  };
}

export async function signUp({ email, password, displayName }: SignUpInput): Promise<AuthActionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName ?? email.split('@')[0] },
    },
  });

  if (error) {
    return { data: null, error: mapAuthError(error, 'auth:signUp') };
  }

  return { data, error: null };
}

export async function signIn({ email, password }: AuthCredentials): Promise<AuthActionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { data: null, error: mapAuthError(error, 'auth:signIn') };
  }

  return { data, error: null };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string): Promise<AuthActionResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset`,
  });

  if (error) {
    return { data: null, error: mapAuthError(error, 'auth:resetPassword') };
  }

  return { data: { ok: true }, error: null };
}

export async function resendSignupConfirmation(email: string): Promise<AuthActionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/coach` : undefined,
    },
  });

  if (error) {
    return { data: null, error: mapAuthError(error, 'auth:resendSignupConfirmation') };
  }

  return { data, error: null };
}
