/**
 * Centralized monitoring / error-capture layer.
 *
 * Currently writes structured logs to the console and is intentionally
 * designed so it can be swapped for Sentry, Datadog, or LogRocket by
 * replacing the `reportToService()` call at the bottom of this file.
 *
 * Usage:
 *   captureError(err, { context: 'diary:save', userId, sessionId })
 *   captureMessage('Processing timed out', 'warning', { context: 'diary:process', userId, sessionId })
 */

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

  reportToService('error', message, { ...meta, stack });
}

/**
 * Capture a non-exception event (timeout, fallback, degraded mode, etc).
 */
export function captureMessage(
  message: string,
  severity: MonitoringSeverity,
  meta: MonitoringContext,
): void {
  reportToService(severity, message, meta);
}

// ──────────────────────────────────────────────────────────────
// Transport layer — swap this for Sentry / Datadog / LogRocket
// ──────────────────────────────────────────────────────────────

function reportToService(
  severity: MonitoringSeverity,
  message: string,
  meta: Record<string, unknown>,
): void {
  const payload = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    app: 'vanto-coach',
    ...meta,
  };

  // Structured console output — always present regardless of service
  if (severity === 'error' || severity === 'fatal') {
    console.error('[vanto-monitor]', payload);
  } else if (severity === 'warning') {
    console.warn('[vanto-monitor]', payload);
  } else {
    console.info('[vanto-monitor]', payload);
  }

  // ── Sentry integration point ──────────────────────────────────
  // When you add @sentry/nextjs, uncomment and replace below:
  //
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.withScope((scope) => {
  //   scope.setTag('context', meta.context as string);
  //   if (meta.userId) scope.setUser({ id: meta.userId as string });
  //   if (meta.sessionId) scope.setTag('sessionId', meta.sessionId as string);
  //   if (err instanceof Error) {
  //     Sentry.captureException(err);
  //   } else {
  //     Sentry.captureMessage(message, severity === 'fatal' ? 'fatal' : severity as Sentry.SeverityLevel);
  //   }
  // });
}
