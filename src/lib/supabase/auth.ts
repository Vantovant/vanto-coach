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
  inviteCode?: string;
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

export async function signUp({ email, password, displayName, inviteCode }: SignUpInput): Promise<AuthActionResult> {
  const supabase = createClient();

  if (!inviteCode || inviteCode.trim() === '') {
    return {
      data: null,
      error: {
        code: 'invite_code_required',
        title: 'Invite code required',
        message: 'Enter a valid invite code to join the beta.',
      },
    };
  }

  const { data: inviteValidation, error: inviteError } = await supabase.rpc('validate_beta_invite_code', {
    candidate_code: inviteCode.trim(),
  });

  if (inviteError) {
    captureMessage(`invite validation failed: ${inviteError.message}`, 'warning', {
      context: 'auth:validateInviteCode',
      supabaseCode: inviteError.code,
    });

    return {
      data: null,
      error: {
        code: 'invite_validation_failed',
        title: 'Invite code unavailable',
        message: 'We could not validate that invite code right now. Please try again.',
      },
    };
  }

  const inviteRow = Array.isArray(inviteValidation) ? inviteValidation[0] : inviteValidation;
  if (!inviteRow?.is_valid) {
    const reason = inviteRow?.reason ?? 'invalid_code';
    const message = reason === 'expired_code'
      ? 'That invite code has expired.'
      : reason === 'code_already_used'
      ? 'That invite code has already been used.'
      : reason === 'inactive_code'
      ? 'That invite code is no longer active.'
      : 'That invite code is invalid.';

    return {
      data: null,
      error: {
        code: reason,
        title: 'Invite code invalid',
        message,
      },
    };
  }

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

  try {
    const userId = data?.user?.id ?? null;
    const userEmail = data?.user?.email ?? email;
    const inviteId = inviteRow?.id ?? null;

    if (inviteId && userId) {
      await supabase.rpc('consume_beta_invite_code', {
        invite_code_id: inviteId,
        signup_user_id: userId,
        signup_email: userEmail,
      });
    }
  } catch (consumeError) {
    captureMessage('invite code consume failed', 'warning', {
      context: 'auth:consumeInviteCode',
      error: consumeError instanceof Error ? consumeError.message : String(consumeError),
    });
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
