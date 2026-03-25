'use client';

import * as React from 'react';
import type { CoachSession } from '@/types/coach';
import { getSessionsPage, SESSION_PAGE_SIZE, type SessionsPageResult } from '@/lib/supabase/db';
import { useAuth } from '@/context/AuthContext';

export interface UseSessionsReturn {
  sessions: CoachSession[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  /** Reload the first page (replaces current list) */
  refresh: () => Promise<void>;
  /** Append the next page to the current list */
  loadMore: () => Promise<void>;
  /** Filter by mood + search text — re-queries DB from the first page */
  applyFilter: (mood: string | null, search: string | null) => void;
  /** Optimistically add a new session to the top of the list */
  prependSession: (session: CoachSession) => void;
  /** Optimistically remove a session from the list */
  removeSession: (id: string) => void;
  /** Replace a single session in-memory (e.g. after retry persistence succeeds) */
  updateSession: (updated: CoachSession) => void;
}

export function useSessions(): UseSessionsReturn {
  const { user } = useAuth();
  // Use the stable user ID string — TOKEN_REFRESHED events produce a new User
  // object with the same id and must NOT trigger a redundant DB reload.
  const userId = user?.id ?? null;

  const [sessions, setSessions] = React.useState<CoachSession[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Cursor = created_at of the last session in the current list
  const cursorRef = React.useRef<string | null>(null);

  // Active filter — changes trigger a full reload from page 1
  const [filterMood, setFilterMood] = React.useState<string | null>(null);
  const [filterSearch, setFilterSearch] = React.useState<string | null>(null);

  // ── Initial / refresh load ─────────────────────────────────────────────────
  const load = React.useCallback(async (
    mood: string | null = filterMood,
    search: string | null = filterSearch,
  ) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { sessions: data, nextCursor }: SessionsPageResult =
        await getSessionsPage(SESSION_PAGE_SIZE, null, mood, search);
      // Merge: preserve any local-only optimistic entries not yet in the DB response
      const freshIds = new Set(data.map(s => s.id));
      setSessions(prev => {
        const localOnly = prev.filter(
          s => s.id.startsWith('session-local-') && !freshIds.has(s.id)
        );
        return [...localOnly, ...data];
      });
      cursorRef.current = nextCursor;
      setHasMore(nextCursor !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Load more (next page) ──────────────────────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (!userId || loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const { sessions: data, nextCursor }: SessionsPageResult = await getSessionsPage(
        SESSION_PAGE_SIZE,
        cursorRef.current,
        filterMood,
        filterSearch,
      );
      setSessions(prev => {
        // Deduplicate — DB rows win over same-ID entries already in state
        const existingIds = new Set(prev.map(s => s.id));
        const fresh = data.filter(s => !existingIds.has(s.id));
        return [...prev, ...fresh];
      });
      cursorRef.current = nextCursor;
      setHasMore(nextCursor !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more sessions');
    } finally {
      setLoadingMore(false);
    }
  }, [userId, loadingMore, hasMore, filterMood, filterSearch]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const applyFilter = React.useCallback((mood: string | null, search: string | null) => {
    setFilterMood(mood);
    setFilterSearch(search);
    // Reload from page 1 with new filter — load() reads the latest filter values
    // via closure, so we pass them explicitly to avoid stale state
    if (!userId) return;
    setLoading(true);
    setError(null);
    getSessionsPage(SESSION_PAGE_SIZE, null, mood, search)
      .then(({ sessions: data, nextCursor }: SessionsPageResult) => {
        setSessions(data);
        cursorRef.current = nextCursor;
        setHasMore(nextCursor !== null);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Filter failed'))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    load(null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Optimistic mutations ───────────────────────────────────────────────────
  const prependSession = React.useCallback((session: CoachSession) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  const removeSession = React.useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSession = React.useCallback((updated: CoachSession) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, []);

  return {
    sessions,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh: () => load(filterMood, filterSearch),
    loadMore,
    applyFilter,
    prependSession,
    removeSession,
    updateSession,
  };
}
