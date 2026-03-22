/**
 * Vanto Coach — Supabase Data Access Layer
 *
 * All Supabase calls are centralised here.
 * UI components must NOT import createClient directly.
 */

import { createClient } from './client';
import type {
  CoachSession,
  CoachMemory,
  CoachActionItem,
  CoachSettings,
} from '@/types/coach';

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

/** Default page size for diary session loading */
export const SESSION_PAGE_SIZE = 20;

const SESSION_SELECT = `
  *,
  coach_structured_entries(*),
  coach_action_items(*),
  coach_scripture_refs(*),
  coach_prayer_points(*)
` as const;

/**
 * Fetch the first page of sessions (newest first).
 * Returns at most SESSION_PAGE_SIZE rows as a plain array.
 * @deprecated Prefer getRecentSessions(n) or getSessionsPage() for new callers.
 */
export async function getSessions(): Promise<CoachSession[]> {
  const { sessions } = await getSessionsPage(SESSION_PAGE_SIZE);
  return sessions;
}

export interface SessionsPageResult {
  sessions: CoachSession[];
  nextCursor: string | null;
}

/**
 * Load a page of sessions using keyset (cursor-based) pagination.
 *
 * @param limit  Number of rows per page (default SESSION_PAGE_SIZE)
 * @param cursor ISO timestamp of the last session seen — pass the `created_at`
 *               of the last item to get the next page. Omit / null for the first page.
 * @param mood   Optional mood filter applied at the database level.
 * @param search Optional full-text search applied to title + raw_transcript.
 *
 * Returns { sessions, nextCursor } — nextCursor is null when no more pages exist.
 */
export async function getSessionsPage(
  limit: number = SESSION_PAGE_SIZE,
  cursor: string | null = null,
  mood: string | null = null,
  search: string | null = null,
): Promise<SessionsPageResult> {
  const supabase = createClient();

  // Fetch limit+1 so we know whether another page exists without a COUNT query
  let query = supabase
    .from('coach_sessions')
    .select(SESSION_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  if (mood) {
    query = query.eq('mood', mood);
  }
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,raw_transcript.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('[db] getSessionsPage error:', error.message);
    return { sessions: [], nextCursor: null };
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const sessions = pageRows.map(rowToSession);
  const nextCursor = hasMore ? (pageRows[pageRows.length - 1].created_at as string) : null;
  return { sessions, nextCursor };
}

/**
 * Fetch only the N most-recent sessions.
 * Used by TodayTab, InsightsTab — avoids loading the full history.
 */
export async function getRecentSessions(limit: number): Promise<CoachSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_sessions')
    .select(SESSION_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[db] getRecentSessions error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToSession);
}

export async function getSessionById(id: string): Promise<CoachSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_sessions')
    .select(`
      *,
      coach_structured_entries(*),
      coach_action_items(*),
      coach_scripture_refs(*),
      coach_prayer_points(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return rowToSession(data);
}

export interface CreateSessionInput {
  title: string;
  session_date: string;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  raw_transcript: string | null;
  cleaned_transcript: string | null;
  summary: string | null;
  mood: string | null;
  sentiment_score: number | null;
  life_areas: string[];
  spiritual_topics: string[];
  coach_response: string | null;
  action_status: 'pending' | 'extracted' | 'applied' | 'none';
  // Related rows
  structured_entry?: {
    wins: string[];
    struggles: string[];
    fears: string[];
    decisions: string[];
    people: string[];
    opportunities: string[];
    gratitude: string[];
    followups: string[];
    prayer_requests: string[];
    scripture_reflections: string[];
    habits: string[];
    finances: string[];
    health: string[];
    calling: string[];
    relationships: string[];
    leadership: string[];
  } | null;
  action_items?: Array<{
    title: string;
    action_type: string;
    priority: string;
    category: string | null;
  }>;
  scripture_refs?: Array<{
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    text: string;
    translation: string;
    ref_type: 'primary' | 'supporting';
  }>;
  prayer_points?: Array<{
    content: string;
    category: string | null;
  }>;
}

export async function createSession(input: CreateSessionInput): Promise<CoachSession | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[db] createSession: no authenticated user');
    return null;
  }

  const { data: session, error: sessionError } = await supabase
    .from('coach_sessions')
    .insert({
      user_id: user.id,
      title: input.title,
      session_date: input.session_date,
      audio_url: input.audio_url,
      audio_duration_seconds: input.audio_duration_seconds,
      raw_transcript: input.raw_transcript,
      cleaned_transcript: input.cleaned_transcript,
      summary: input.summary,
      mood: input.mood,
      sentiment_score: input.sentiment_score,
      life_areas: input.life_areas,
      spiritual_topics: input.spiritual_topics,
      coach_response: input.coach_response,
      action_status: input.action_status,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error('[db] createSession insert error:', sessionError?.message);
    return null;
  }

  const sessionId = session.id;

  // Insert structured entry
  if (input.structured_entry) {
    const { error: entryError } = await supabase
      .from('coach_structured_entries')
      .insert({ session_id: sessionId, user_id: user.id, ...input.structured_entry });
    if (entryError) console.error('[db] structured entry error:', entryError.message);
  }

  // Insert action items
  if (input.action_items?.length) {
    const rows = input.action_items.map(a => ({
      session_id: sessionId,
      user_id: user.id,
      title: a.title,
      action_type: a.action_type,
      priority: a.priority,
      category: a.category,
      source: 'coach_extract' as const,
      status: 'pending' as const,
      dedupe_key: `${user.id}|${a.title.slice(0, 30)}|${session.session_date}`,
    }));
    const { error: actionsError } = await supabase.from('coach_action_items').insert(rows);
    if (actionsError) console.error('[db] action items error:', actionsError.message);
  }

  // Insert scripture refs
  if (input.scripture_refs?.length) {
    const rows = input.scripture_refs.map(s => ({
      session_id: sessionId,
      user_id: user.id,
      ...s,
    }));
    const { error: scriptureError } = await supabase.from('coach_scripture_refs').insert(rows);
    if (scriptureError) console.error('[db] scripture refs error:', scriptureError.message);
  }

  // Insert prayer points
  if (input.prayer_points?.length) {
    const rows = input.prayer_points.map(p => ({
      session_id: sessionId,
      user_id: user.id,
      content: p.content,
      category: p.category,
    }));
    const { error: prayerError } = await supabase.from('coach_prayer_points').insert(rows);
    if (prayerError) console.error('[db] prayer points error:', prayerError.message);
  }

  return getSessionById(sessionId);
}

// ─────────────────────────────────────────────
// Retry / AI result persistence
// ─────────────────────────────────────────────

export interface UpdateSessionAIInput {
  /** Cleaned transcript from AI (may be same as raw if no cleaning applied) */
  cleaned_transcript?: string | null;
  /** One-paragraph session summary */
  summary?: string | null;
  /** Detected mood */
  mood?: string | null;
  /** Sentiment score 0-1 */
  sentiment_score?: number | null;
  /** Life areas derived from key topics */
  life_areas?: string[];
  /** Spiritual topics detected */
  spiritual_topics?: string[];
  /** Coach response / analysis confirmation string */
  coach_response?: string | null;
  /** Mark action items as extracted */
  action_status?: 'pending' | 'extracted' | 'applied' | 'none';
  /** New action item rows to insert for this session */
  action_items?: Array<{
    title: string;
    action_type: string;
    priority: string;
    category: string | null;
  }>;
  /** New prayer point rows to insert for this session */
  prayer_points?: Array<{
    content: string;
    category: string | null;
  }>;
}

/**
 * Persists AI processing results back into an existing diary session.
 * Called after a successful retry so the session becomes fully AI-complete.
 *
 * - Updates the coach_sessions row with all provided AI fields.
 * - Inserts new action_item and prayer_point rows (skips if none provided).
 * - Returns the fully refreshed CoachSession, or null on failure.
 */
export async function updateSessionAIResults(
  sessionId: string,
  input: UpdateSessionAIInput,
): Promise<CoachSession | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[db] updateSessionAIResults: no authenticated user');
    return null;
  }

  const now = new Date().toISOString();

  // 1. Patch the session row
  const patch: Record<string, unknown> = { updated_at: now };
  if (input.cleaned_transcript !== undefined) patch.cleaned_transcript = input.cleaned_transcript;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.mood !== undefined) patch.mood = input.mood;
  if (input.sentiment_score !== undefined) patch.sentiment_score = input.sentiment_score;
  if (input.life_areas !== undefined) patch.life_areas = input.life_areas;
  if (input.spiritual_topics !== undefined) patch.spiritual_topics = input.spiritual_topics;
  if (input.coach_response !== undefined) patch.coach_response = input.coach_response;
  if (input.action_status !== undefined) patch.action_status = input.action_status;

  const { error: patchError } = await supabase
    .from('coach_sessions')
    .update(patch)
    .eq('id', sessionId)
    .eq('user_id', user.id); // RLS belt-and-suspenders

  if (patchError) {
    console.error('[db] updateSessionAIResults patch error:', patchError.message);
    return null;
  }

  // 2. Insert action items (idempotent: dedupe_key prevents true duplicates)
  if (input.action_items?.length) {
    const session_date = new Date().toISOString().split('T')[0];
    const rows = input.action_items.map(a => ({
      session_id: sessionId,
      user_id: user.id,
      title: a.title,
      action_type: a.action_type,
      priority: a.priority,
      category: a.category,
      source: 'coach_extract' as const,
      status: 'pending' as const,
      dedupe_key: `${user.id}|${a.title.slice(0, 30)}|${session_date}`,
    }));
    const { error: actionsError } = await supabase
      .from('coach_action_items')
      .upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true });
    if (actionsError) console.error('[db] updateSessionAIResults action_items error:', actionsError.message);
  }

  // 3. Replace prayer points atomically.
  // Strategy: delete all existing rows for this session, then insert the new set.
  // Both ops run sequentially in the same RLS context.  If the insert fails the
  // old rows are already gone — acceptable for a retry scenario where the caller
  // can retry again.  A Postgres RPC transaction would be the ideal long-term fix
  // but requires a migration; this is sufficient for current scale.
  if (input.prayer_points !== undefined) {
    await supabase
      .from('coach_prayer_points')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id); // RLS belt-and-suspenders

    if (input.prayer_points.length > 0) {
      const rows = input.prayer_points.map(p => ({
        session_id: sessionId,
        user_id: user.id,
        content: p.content,
        category: p.category,
      }));
      const { error: prayerError } = await supabase
        .from('coach_prayer_points')
        .insert(rows);
      if (prayerError) console.error('[db] updateSessionAIResults prayer_points error:', prayerError.message);
    }
  }

  // 4. Upsert coach_structured_entries so SessionCard counts are immediately correct.
  //
  // SessionCard derives action/prayer counts from:
  //   session.structured_entry.followups.length
  //   session.structured_entry.prayer_requests.length
  //
  // These come from the coach_structured_entries join in rowToSession().
  // If the original save created no structured entry (e.g. transcript-only save),
  // we insert a fresh row.  If one exists we update only followups + prayer_requests
  // so the other columns (wins, struggles, etc.) are preserved.
  //
  // Idempotent: upsert on session_id conflict — safe to call on every retry.
  if (input.action_items !== undefined || input.prayer_points !== undefined) {
    const followups = (input.action_items ?? []).map(a => a.title);
    const prayer_requests = (input.prayer_points ?? []).map(p => p.content);

    // Check whether a structured entry row already exists for this session
    const { data: existingEntry } = await supabase
      .from('coach_structured_entries')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingEntry) {
      // Update only the derived list columns — preserve any human-written fields
      const { error: entryUpdateError } = await supabase
        .from('coach_structured_entries')
        .update({ followups, prayer_requests })
        .eq('id', existingEntry.id);
      if (entryUpdateError) {
        console.error('[db] updateSessionAIResults structured_entry update error:', entryUpdateError.message);
      }
    } else {
      // Insert a minimal structured entry row with the AI-derived lists
      const { error: entryInsertError } = await supabase
        .from('coach_structured_entries')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          followups,
          prayer_requests,
          wins: [],
          struggles: [],
          fears: [],
          decisions: [],
          people: [],
          opportunities: [],
          gratitude: [],
          scripture_reflections: [],
          habits: [],
          finances: [],
          health: [],
          calling: [],
          relationships: [],
          leadership: [],
        });
      if (entryInsertError) {
        console.error('[db] updateSessionAIResults structured_entry insert error:', entryInsertError.message);
      }
    }
  }

  // 5. Return the fully refreshed session (picks up all related rows via joins)
  return getSessionById(sessionId);
}

export async function softDeleteSession(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('coach_sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[db] softDeleteSession error:', error.message); return false; }
  return true;
}

// ─────────────────────────────────────────────
// PRAYER POINTS
// ─────────────────────────────────────────────

export interface PrayerPointRow {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  category: string | null;
  status: 'active' | 'answered' | 'continuing';
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPrayerPoints(status?: 'active' | 'answered' | 'continuing'): Promise<PrayerPointRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('coach_prayer_points')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) { console.error('[db] getPrayerPoints error:', error.message); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────
// MEMORIES
// ─────────────────────────────────────────────

export interface UpsertMemoryInput {
  memory_type: CoachMemory['memory_type'];
  title: string;
  summary: string;
  confidence: number;
  related_session_ids: string[];
  suggested_actions: string[];
  growth_indicators: CoachMemory['growth_indicators'];
  scripture_refs: CoachMemory['scripture_refs'];
}

/**
 * Insert a new memory row or update an existing one that shares the same
 * (user_id, memory_type, title) combination (title is used as a natural key).
 * Returns the upserted row or null on failure.
 */
export async function upsertMemory(input: UpsertMemoryInput): Promise<CoachMemory | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { console.error('[db] upsertMemory: no authenticated user'); return null; }

  const now = new Date().toISOString();

  // Try to find an existing memory with same type+title for this user
  const { data: existing } = await supabase
    .from('coach_memories')
    .select('id, occurrence_count, first_seen_at, related_session_ids')
    .eq('user_id', user.id)
    .eq('memory_type', input.memory_type)
    .eq('title', input.title)
    .maybeSingle();

  if (existing) {
    // Merge session IDs without duplicates
    const mergedIds = Array.from(
      new Set([...(existing.related_session_ids ?? []), ...input.related_session_ids])
    );
    const { data, error } = await supabase
      .from('coach_memories')
      .update({
        summary: input.summary,
        confidence: Math.min(99, input.confidence + 3), // confidence grows with repetition
        occurrence_count: (existing.occurrence_count ?? 1) + 1,
        last_seen_at: now,
        related_session_ids: mergedIds,
        suggested_actions: input.suggested_actions,
        growth_indicators: input.growth_indicators,
        scripture_refs: input.scripture_refs,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) { console.error('[db] upsertMemory update error:', error.message); return null; }
    return data as CoachMemory;
  }

  // Insert new memory
  const { data, error } = await supabase
    .from('coach_memories')
    .insert({
      user_id: user.id,
      memory_type: input.memory_type,
      title: input.title,
      summary: input.summary,
      confidence: input.confidence,
      first_seen_at: now,
      last_seen_at: now,
      occurrence_count: 1,
      related_session_ids: input.related_session_ids,
      suggested_actions: input.suggested_actions,
      growth_indicators: input.growth_indicators,
      scripture_refs: input.scripture_refs,
      is_pinned: false,
      is_archived: false,
    })
    .select()
    .single();
  if (error) { console.error('[db] upsertMemory insert error:', error.message); return null; }
  return data as CoachMemory;
}

export async function getMemories(): Promise<CoachMemory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_memories')
    .select('*')
    .eq('is_archived', false)
    .order('last_seen_at', { ascending: false });

  if (error) { console.error('[db] getMemories error:', error.message); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────
// ACTION ITEMS
// ─────────────────────────────────────────────

export async function getActionItems(): Promise<CoachActionItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_action_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('[db] getActionItems error:', error.message); return []; }
  return data ?? [];
}

export async function updateActionItemStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'synced'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('coach_action_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[db] updateActionItemStatus error:', error.message); return false; }
  return true;
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export async function getSettings(): Promise<CoachSettings | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data.settings as CoachSettings ?? null;
}

export async function upsertSettings(settings: Partial<CoachSettings>): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ settings: { ...settings, user_id: user.id, updated_at: new Date().toISOString() } })
    .eq('id', user.id);

  if (error) { console.error('[db] upsertSettings error:', error.message); return false; }
  return true;
}

// ─────────────────────────────────────────────
// ROW MAPPER
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSession(row: any): CoachSession {
  const entry = row.coach_structured_entries?.[0] ?? null;
  const scriptureRefs = row.coach_scripture_refs ?? [];
  const prayerPoints = row.coach_prayer_points ?? [];
  const actionItems = row.coach_action_items ?? [];

  const primaryVerse = scriptureRefs.find((r: { ref_type: string }) => r.ref_type === 'primary');
  const supportingVerses = scriptureRefs.filter((r: { ref_type: string }) => r.ref_type === 'supporting');

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    session_date: row.session_date,
    audio_url: row.audio_url,
    audio_duration_seconds: row.audio_duration_seconds,
    raw_transcript: row.raw_transcript,
    cleaned_transcript: row.cleaned_transcript,
    summary: row.summary,
    mood: row.mood,
    sentiment_score: row.sentiment_score,
    life_areas: row.life_areas ?? [],
    spiritual_topics: row.spiritual_topics ?? [],
    coach_response: row.coach_response,
    biblical_response: primaryVerse
      ? {
          primary_verse: {
            book: primaryVerse.book,
            chapter: primaryVerse.chapter,
            verse_start: primaryVerse.verse_start,
            verse_end: primaryVerse.verse_end,
            text: primaryVerse.text,
            translation: primaryVerse.translation,
          },
          supporting_verses: supportingVerses.map((v: {
            book: string; chapter: number; verse_start: number;
            verse_end: number | null; text: string; translation: string;
          }) => ({
            book: v.book,
            chapter: v.chapter,
            verse_start: v.verse_start,
            verse_end: v.verse_end,
            text: v.text,
            translation: v.translation,
          })),
          explanation: '',
          application: '',
          prayer: prayerPoints.map((p: { content: string }) => p.content).join('\n') || '',
          reflection_question: '',
          action_step: actionItems.map((a: { title: string }) => a.title).join('; ') || '',
        }
      : null,
    action_status: row.action_status ?? 'none',
    structured_entry: entry
      ? {
          wins: entry.wins ?? [],
          struggles: entry.struggles ?? [],
          fears: entry.fears ?? [],
          decisions: entry.decisions ?? [],
          people: entry.people ?? [],
          opportunities: entry.opportunities ?? [],
          gratitude: entry.gratitude ?? [],
          followups: entry.followups ?? [],
          prayer_requests: entry.prayer_requests ?? [],
          scripture_reflections: entry.scripture_reflections ?? [],
          habits: entry.habits ?? [],
          finances: entry.finances ?? [],
          health: entry.health ?? [],
          calling: entry.calling ?? [],
          relationships: entry.relationships ?? [],
          leadership: entry.leadership ?? [],
        }
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}
