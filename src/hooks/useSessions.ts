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
  const [sessions, setSessions] = React.useState<CoachSession[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    load();
  }, [load]);

  const prependSession = React.useCallback((session: CoachSession) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  return { sessions, loading, error, refresh: load, prependSession };
}
