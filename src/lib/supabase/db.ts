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
    console.error('[db] getSessions error:', error.message);
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
