'use client';

import * as React from 'react';
import type { CoachSession } from '@/types/coach';
import { getSessions } from '@/lib/supabase/db';
import { useAuth } from '@/context/AuthContext';

export interface UseSessionsReturn {
  sessions: CoachSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  prependSession: (session: CoachSession) => void;
}

export function useSessions(): UseSessionsReturn {
  const { user } = useAuth();
  // Use the stable user ID string (not the object reference) so that Supabase
  // TOKEN_REFRESHED events — which produce a new User object with the same id —
  // do NOT trigger a redundant DB reload and do NOT wipe optimistic sessions.
  const userId = user?.id ?? null;
  const [sessions, setSessions] = React.useState<CoachSession[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      // Merge: preserve any local-only optimistic entries not yet in the DB response,
      // and deduplicate — DB rows always win over same-ID optimistic rows.
      const freshIds = new Set(data.map(s => s.id));
      setSessions(prev => {
        const localOnly = prev.filter(s => s.id.startsWith('session-local-') && !freshIds.has(s.id));
        return [...localOnly, ...data];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const prependSession = React.useCallback((session: CoachSession) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  return { sessions, loading, error, refresh: load, prependSession };
}
