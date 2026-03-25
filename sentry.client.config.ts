/**
 * Sentry browser/client initialization.
 *
 * Set NEXT_PUBLIC_SENTRY_DSN in your environment to enable.
 * Without the DSN, Sentry is a no-op and monitoring.ts falls
 * back to console-only output — safe to deploy either way.
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Only replay sessions that have errors
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Don't capture errors from browser extensions
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop',
    ],
  });
}
