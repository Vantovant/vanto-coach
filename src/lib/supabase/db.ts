/**
 * Vanto Coach — Supabase Data Access Layer
 *
 * All Supabase calls are centralised here.
 * UI components must NOT import createClient directly.
 */

import { createClient } from './client';
import { captureError, captureMessage } from '@/lib/monitoring';
import type {
  CoachSession,
  CoachMemory,
  CoachActionItem,
  CoachSettings,
} from '@/types/coach';

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

export async function getSessions(): Promise<CoachSession[]> {
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
    .is('deleted_at', null)
    .order('session_date', { ascending: false });

  if (error) {
    captureMessage(`getSessions failed: ${error.message}`, 'error', {
      context: 'db:getSessions',
      supabaseCode: error.code,
    });
    return [];
  }

  return (data ?? []).map(rowToSession);
}
export const SESSION_PAGE_SIZE = 20;

export interface SessionsPageResult {
  sessions: CoachSession[];
  nextCursor: string | null;
}

export async function getRecentSessions(limit = 5): Promise<CoachSession[]> {
  const sessions = await getSessions();
  return sessions.slice(0, limit);
}

export async function getSessionsPage(
  limit = SESSION_PAGE_SIZE,
  cursor: string | null = null,
  mood?: string | null,
  search?: string | null
): Promise<SessionsPageResult> {
  const sessions = await getSessions();

  const normalizedMood =
    mood && mood.trim() !== '' && mood.toLowerCase() !== 'all'
      ? mood.toLowerCase()
      : null;

  const normalizedSearch =
    search && search.trim() !== ''
      ? search.toLowerCase().trim()
      : null;

  const filtered = sessions.filter((session) => {
    const s = session as unknown as Record<string, unknown>;

    if (normalizedMood) {
      const sessionMood =
        typeof s.mood === 'string' ? s.mood.toLowerCase() : '';

      if (sessionMood !== normalizedMood) {
        return false;
      }
    }

    if (normalizedSearch) {
      const haystack = [
        s.id,
        s.title,
        s.summary,
        s.mood,
        s.cleaned_transcript,
        s.raw_transcript,
        s.coach_response,
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    return true;
  });

  const startIndex = cursor
    ? Math.max(
        0,
        filtered.findIndex((session) => session.id === cursor) + 1
      )
    : 0;

  const page = filtered.slice(startIndex, startIndex + limit);
  const nextCursor =
    startIndex + limit < filtered.length && page.length > 0
      ? page[page.length - 1].id
      : null;

  return {
    sessions: page,
    nextCursor,
  };
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

  if (error || !data) {
    if (error) {
      captureMessage(`getSessionById failed: ${error.message}`, 'warning', {
        context: 'db:getSessionById',
        sessionId: id,
        supabaseCode: error.code,
      });
    }
    return null;
  }
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
    captureMessage('createSession: no authenticated user', 'error', {
      context: 'db:createSession',
    });
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
    captureMessage(`createSession insert failed: ${sessionError?.message ?? 'unknown'}`, 'error', {
      context: 'db:createSession',
      userId: user.id,
      supabaseCode: sessionError?.code,
    });
    return null;
  }

  const sessionId = session.id;

  // Insert structured entry
  if (input.structured_entry) {
    const { error: entryError } = await supabase
      .from('coach_structured_entries')
      .insert({ session_id: sessionId, user_id: user.id, ...input.structured_entry });
    if (entryError) {
      captureMessage(`structured entry insert failed: ${entryError.message}`, 'warning', {
        context: 'db:createSession:structuredEntry',
        sessionId,
        supabaseCode: entryError.code,
      });
    }
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
    if (actionsError) {
      captureMessage(`action items insert failed: ${actionsError.message}`, 'warning', {
        context: 'db:createSession:actionItems',
        sessionId,
        supabaseCode: actionsError.code,
      });
    }
  }

  // Insert scripture refs
  if (input.scripture_refs?.length) {
    const rows = input.scripture_refs.map(s => ({
      session_id: sessionId,
      user_id: user.id,
      ...s,
    }));
    const { error: scriptureError } = await supabase.from('coach_scripture_refs').insert(rows);
    if (scriptureError) {
      captureMessage(`scripture refs insert failed: ${scriptureError.message}`, 'warning', {
        context: 'db:createSession:scriptureRefs',
        sessionId,
        supabaseCode: scriptureError.code,
      });
    }
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
    if (prayerError) {
      captureMessage(`prayer points insert failed: ${prayerError.message}`, 'warning', {
        context: 'db:createSession:prayerPoints',
        sessionId,
        supabaseCode: prayerError.code,
      });
    }
  }

  return getSessionById(sessionId);
}

export async function softDeleteSession(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('coach_sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    captureMessage(`softDeleteSession failed: ${error.message}`, 'error', {
      context: 'db:softDeleteSession',
      sessionId: id,
      supabaseCode: error.code,
    });
    return false;
  }
  return true;
}

/**
 * Update AI-processed fields on an existing session after a successful retry.
 * Only touches fields that the AI analysis populates — never overwrites audio/transcript.
 */
export async function updateSessionProcessing(
  sessionId: string,
  update: {
    summary?: string;
    mood?: string | null;
    sentiment_score?: number | null;
    life_areas?: string[];
    spiritual_topics?: string[];
    coach_response?: string | null;
    action_status?: 'pending' | 'extracted' | 'applied' | 'none';
    cleaned_transcript?: string;
  },
  relatedRows?: {
    followups?: string[];
    prayer_requests?: string[];
  }
): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    captureMessage('updateSessionProcessing: no authenticated user', 'error', {
      context: 'db:updateSessionProcessing',
      sessionId,
    });
    return false;
  }

  const { error: updateError } = await supabase
    .from('coach_sessions')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateError) {
    captureMessage(`updateSessionProcessing failed: ${updateError.message}`, 'error', {
      context: 'db:updateSessionProcessing',
      sessionId,
      supabaseCode: updateError.code,
    });
    return false;
  }

  // Upsert structured entry if followups/prayer_requests are provided
  if (relatedRows && (relatedRows.followups?.length || relatedRows.prayer_requests?.length)) {
    // Check if structured entry already exists
    const { data: existing } = await supabase
      .from('coach_structured_entries')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('coach_structured_entries')
        .update({
          followups: relatedRows.followups ?? [],
          prayer_requests: relatedRows.prayer_requests ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    } else {
      await supabase
        .from('coach_structured_entries')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          wins: [], struggles: [], fears: [], decisions: [], people: [],
          opportunities: [], gratitude: [],
          followups: relatedRows.followups ?? [],
          prayer_requests: relatedRows.prayer_requests ?? [],
          scripture_reflections: [], habits: [], finances: [], health: [],
          calling: [], relationships: [], leadership: [],
        });
    }

    // Insert new action items from retry (de-duped by dedupe_key)
    if (relatedRows.followups?.length) {
      const rows = relatedRows.followups.map(title => ({
        session_id: sessionId,
        user_id: user.id,
        title,
        action_type: 'task',
        priority: 'medium',
        category: null,
        source: 'coach_extract' as const,
        status: 'pending' as const,
        dedupe_key: `${user.id}|${title.slice(0, 30)}|retry`,
      }));
      await supabase
        .from('coach_action_items')
        .upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true });
    }

    // Insert new prayer points from retry
    if (relatedRows.prayer_requests?.length) {
      const rows = relatedRows.prayer_requests.map(content => ({
        session_id: sessionId,
        user_id: user.id,
        content,
        category: null,
      }));
      await supabase.from('coach_prayer_points').insert(rows);
    }
  }

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
  if (error) {
    captureMessage(`getPrayerPoints failed: ${error.message}`, 'warning', {
      context: 'db:getPrayerPoints',
      supabaseCode: error.code,
    });
    return [];
  }
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
  if (!user) {
    captureMessage('upsertMemory: no authenticated user', 'error', {
      context: 'db:upsertMemory',
    });
    return null;
  }

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
    if (error) {
      captureMessage(`upsertMemory update failed: ${error.message}`, 'warning', {
        context: 'db:upsertMemory',
        memoryType: input.memory_type,
        supabaseCode: error.code,
      });
      return null;
    }
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
  if (error) {
    captureMessage(`upsertMemory insert failed: ${error.message}`, 'warning', {
      context: 'db:upsertMemory',
      memoryType: input.memory_type,
      supabaseCode: error.code,
    });
    return null;
  }
  return data as CoachMemory;
}

export async function getMemories(): Promise<CoachMemory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_memories')
    .select('*')
    .eq('is_archived', false)
    .order('last_seen_at', { ascending: false });

  if (error) {
    captureMessage(`getMemories failed: ${error.message}`, 'error', {
      context: 'db:getMemories',
      supabaseCode: error.code,
    });
    return [];
  }
  return data ?? [];
}

export async function getArchivedMemories(): Promise<CoachMemory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coach_memories')
    .select('*')
    .eq('is_archived', true)
    .order('last_seen_at', { ascending: false });

  if (error) {
    captureMessage(`getArchivedMemories failed: ${error.message}`, 'error', {
      context: 'db:getArchivedMemories',
      supabaseCode: error.code,
    });
    return [];
  }
  return data ?? [];
}

/**
 * Patch is_pinned or is_archived on a memory row.
 * Returns the updated row on success, null on failure.
 */
export async function patchMemory(
  id: string,
  patch: { is_pinned?: boolean; is_archived?: boolean }
): Promise<CoachMemory | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    captureMessage('patchMemory: no authenticated user', 'error', {
      context: 'db:patchMemory',
      memoryId: id,
    });
    return null;
  }

  const { data, error } = await supabase
    .from('coach_memories')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    captureMessage(`patchMemory failed: ${error?.message ?? 'no data'}`, 'error', {
      context: 'db:patchMemory',
      memoryId: id,
      patch: JSON.stringify(patch),
      supabaseCode: error?.code,
    });
    return null;
  }
  return data as CoachMemory;
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

  if (error) {
    captureMessage(`getActionItems failed: ${error.message}`, 'error', {
      context: 'db:getActionItems',
      supabaseCode: error.code,
    });
    return [];
  }
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
  if (error) {
    captureMessage(`updateActionItemStatus failed: ${error.message}`, 'error', {
      context: 'db:updateActionItemStatus',
      actionItemId: id,
      supabaseCode: error.code,
    });
    return false;
  }
  return true;
}

/**
 * Bulk-update a set of action item IDs to a new status.
 * Returns the count of successful updates.
 */
export async function bulkUpdateActionItemStatus(
  ids: string[],
  status: 'pending' | 'approved' | 'rejected' | 'synced'
): Promise<{ succeeded: number; failed: number }> {
  const results = await Promise.allSettled(
    ids.map(id => updateActionItemStatus(id, status))
  );
  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = ids.length - succeeded;
  return { succeeded, failed };
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export async function createInsightAction(title: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('coach_action_items').insert({
    user_id: user.id,
    title: title.slice(0, 200),
    action_type: 'task',
    priority: 'medium',
    source: 'coach_extract',
    status: 'pending',
    dedupe_key: `${user.id}|insight|${title.slice(0, 30)}|${today}`,
  });
  if (error) {
    captureMessage(`createInsightAction failed: ${error.message}`, 'warning', {
      context: 'db:createInsightAction',
      supabaseCode: error.code,
    });
    return false;
  }
  return true;
}

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

  if (error) {
    captureMessage(`upsertSettings failed: ${error.message}`, 'error', {
      context: 'db:upsertSettings',
      userId: user.id,
      supabaseCode: error.code,
    });
    return false;
  }
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
