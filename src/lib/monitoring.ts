/**
 * Centralized monitoring / error-capture layer.
 *
 * Routes all captures through Sentry when NEXT_PUBLIC_SENTRY_DSN is set,
 * and always writes structured logs to the console for local visibility.
 *
 * Usage:
 *   captureError(err, { context: 'diary:save', userId, sessionId })
 *   captureMessage('Processing timed out', 'warning', { context: 'diary:process', userId, sessionId })
 */

import * as Sentry from '@sentry/nextjs';

export type MonitoringSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface MonitoringContext {
  /** The component or operation where the failure occurred */
  context: string;
  /** Authenticated user ID if available */
  userId?: string | null;
  /** Supabase session / diary entry ID if available */
  sessionId?: string | null;
  /** Route or component path */
  route?: string;
  /** Any additional structured metadata */
  [key: string]: unknown;
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Capture a thrown error with full context.
 * Call this wherever you currently have `console.error`.
 */
export function captureError(
  err: unknown,
  meta: MonitoringContext,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  reportToService('error', message, { ...meta, stack }, err);
}

/**
 * Capture a non-exception event (timeout, fallback, degraded mode, etc).
 */
export function captureMessage(
  message: string,
  severity: MonitoringSeverity,
  meta: MonitoringContext,
): void {
  reportToService(severity, message, meta, null);
}

// ──────────────────────────────────────────────────────────────
// Transport layer — Sentry + console
// ──────────────────────────────────────────────────────────────

function reportToService(
  severity: MonitoringSeverity,
  message: string,
  meta: Record<string, unknown>,
  originalErr: unknown,
): void {
  const payload = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    app: 'vanto-coach',
    ...meta,
  };

  // Structured console output — always present
  if (severity === 'error' || severity === 'fatal') {
    console.error('[vanto-monitor]', payload);
  } else if (severity === 'warning') {
    console.warn('[vanto-monitor]', payload);
  } else {
    console.info('[vanto-monitor]', payload);
  }

  // ── Sentry integration ────────────────────────────────────────
  // Active only when NEXT_PUBLIC_SENTRY_DSN is set. The Sentry SDK
  // is a no-op without an initialised DSN, so this is always safe to call.
  try {
    Sentry.withScope((scope) => {
      scope.setTag('context', meta.context as string);
      scope.setTag('app', 'vanto-coach');
      scope.setLevel(
        severity === 'fatal' ? 'fatal'
        : severity === 'error' ? 'error'
        : severity === 'warning' ? 'warning'
        : 'info'
      );

      if (meta.userId) scope.setUser({ id: meta.userId as string });
      if (meta.sessionId) scope.setTag('sessionId', meta.sessionId as string);
      if (meta.route) scope.setTag('route', meta.route as string);

      // Attach extra metadata (excluding userId/sessionId already set above)
      const { userId: _u, sessionId: _s, route: _r, context: _c, stack: _st, ...extra } = meta;
      if (Object.keys(extra).length) scope.setExtras(extra);

      if (originalErr instanceof Error) {
        Sentry.captureException(originalErr);
      } else {
        Sentry.captureMessage(
          message,
          severity === 'fatal' ? 'fatal'
          : severity === 'error' ? 'error'
          : severity === 'warning' ? 'warning'
          : 'info',
        );
      }
    });
  } catch {
    // Never let Sentry calls crash the application
  }
}
