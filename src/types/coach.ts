// VantoOS Coach Module - Type Definitions

// ============================================
// CORE SESSION TYPES
// ============================================

export interface CoachSession {
  id: string;
  user_id: string;
  title: string;
  session_date: string;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  raw_transcript: string | null;
  cleaned_transcript: string | null;
  summary: string | null;
  mood: SessionMood | null;
  sentiment_score: number | null; // -1 to 1
  life_areas: LifeArea[];
  spiritual_topics: SpiritualTopic[];
  coach_response: string | null;
  biblical_response: BiblicalResponse | null;
  action_status: 'pending' | 'extracted' | 'applied' | 'none';
  structured_entry: StructuredEntry | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type SessionMood =
  | 'grateful'
  | 'hopeful'
  | 'peaceful'
  | 'joyful'
  | 'reflective'
  | 'anxious'
  | 'stressed'
  | 'confused'
  | 'grieving'
  | 'frustrated'
  | 'discouraged'
  | 'overwhelmed'
  | 'determined'
  | 'convicted'
  | 'neutral';

export type LifeArea =
  | 'faith'
  | 'family'
  | 'health'
  | 'finances'
  | 'business'
  | 'leadership'
  | 'relationships'
  | 'purpose'
  | 'habits'
  | 'emotions'
  | 'career'
  | 'ministry'
  | 'rest'
  | 'growth';

export type SpiritualTopic =
  | 'prayer'
  | 'worship'
  | 'faith'
  | 'repentance'
  | 'forgiveness'
  | 'healing'
  | 'guidance'
  | 'provision'
  | 'protection'
  | 'wisdom'
  | 'calling'
  | 'gratitude'
  | 'obedience'
  | 'trust'
  | 'surrender'
  | 'warfare'
  | 'breakthrough'
  | 'testimony';

export interface StructuredEntry {
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
}

export interface BiblicalResponse {
  primary_verse: ScriptureReference;
  supporting_verses: ScriptureReference[];
  explanation: string;
  application: string;
  prayer: string;
  reflection_question: string;
  action_step: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  text: string;
  translation: string;
}

// ============================================
// MEMORY TYPES
// ============================================

export interface CoachMemory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  title: string;
  summary: string;
  confidence: number; // 0-100
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  related_session_ids: string[];
  scripture_refs: ScriptureReference[];
  suggested_actions: string[];
  growth_indicators: GrowthIndicator[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type MemoryType =
  | 'recurring_struggle'
  | 'recurring_victory'
  | 'pattern_behavior'
  | 'pattern_emotional'
  | 'pattern_spiritual'
  | 'relationship_insight'
  | 'leadership_insight'
  | 'business_insight'
  | 'health_insight'
  | 'financial_insight'
  | 'prayer_burden'
  | 'calling_clarity'
  | 'growth_milestone';

export interface GrowthIndicator {
  area: LifeArea;
  direction: 'improving' | 'stable' | 'declining';
  evidence: string;
  since: string;
}

// ============================================
// ACTION ITEM TYPES
// ============================================

export interface CoachActionItem {
  id: string;
  user_id: string;
  session_id: string;
  action_type: ActionType;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  category: LifeArea | null;
  linked_plan_entity_id: string | null;
  linked_plan_entity_type: 'task' | 'reminder' | 'meeting' | null;
  source: 'coach_entry' | 'coach_extract' | 'coach_memory' | 'coach_scripture_plan';
  status: 'pending' | 'approved' | 'rejected' | 'synced';
  dedupe_key: string;
  created_at: string;
  updated_at: string;
}

export type ActionType =
  | 'task'
  | 'reminder'
  | 'meeting'
  | 'goal'
  | 'habit'
  | 'prayer_plan'
  | 'reflection_followup';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

// ============================================
// INSIGHTS TYPES
// ============================================

export interface CoachInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  period_start: string;
  period_end: string;
  title: string;
  summary: string;
  key_observations: string[];
  growth_areas: GrowthArea[];
  challenges: string[];
  recommendations: string[];
  scripture_focus: ScriptureReference[];
  next_steps: string[];
  mood_trend: MoodTrend;
  life_balance: LifeBalanceScore;
  created_at: string;
}

export type InsightType =
  | 'weekly_review'
  | 'monthly_review'
  | 'life_balance'
  | 'spiritual_health'
  | 'habit_consistency'
  | 'leadership_growth'
  | 'goal_progress';

export interface GrowthArea {
  area: LifeArea;
  score: number; // 0-100
  trend: 'up' | 'stable' | 'down';
  insight: string;
}

export interface MoodTrend {
  dominant_mood: SessionMood;
  variance: number; // 0-1
  positive_days: number;
  challenging_days: number;
}

export interface LifeBalanceScore {
  faith: number;
  family: number;
  health: number;
  finances: number;
  business: number;
  relationships: number;
  rest: number;
  growth: number;
}

// ============================================
// DAILY BRIEFING TYPES
// ============================================

export interface CoachDailyBriefing {
  id: string;
  user_id: string;
  briefing_date: string;
  greeting: string;
  todays_focus: string;
  spiritual_focus: string;
  top_action_items: BriefingActionItem[];
  prayer_focus: PrayerFocus;
  scripture_for_today: ScriptureReference;
  pattern_insight: string | null;
  linked_tasks: LinkedPlanItem[];
  linked_reminders: LinkedPlanItem[];
  linked_meetings: LinkedPlanItem[];
  created_at: string;
}

export interface BriefingActionItem {
  title: string;
  priority: Priority;
  category: LifeArea;
  due_date: string | null;
}

export interface PrayerFocus {
  theme: string;
  areas: string[];
  scripture: ScriptureReference | null;
}

export interface LinkedPlanItem {
  id: string;
  title: string;
  type: 'task' | 'reminder' | 'meeting';
  due_date: string | null;
  priority?: Priority;
}

// ============================================
// SCRIPTURE TYPES
// ============================================

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  testament: 'old' | 'new';
  chapters: number;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface SavedVerse {
  id: string;
  user_id: string;
  reference: ScriptureReference;
  note: string | null;
  tags: string[];
  context_session_id: string | null;
  created_at: string;
}

export interface TopicalScripture {
  topic: string;
  description: string;
  verses: ScriptureReference[];
}

// ============================================
// PRAYER TYPES
// ============================================

export interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: PrayerCategory;
  status: 'active' | 'answered' | 'continuing';
  first_prayed_at: string;
  last_prayed_at: string;
  answered_at: string | null;
  answer_testimony: string | null;
  related_session_ids: string[];
  scripture_refs: ScriptureReference[];
  created_at: string;
  updated_at: string;
}

export type PrayerCategory =
  | 'personal'
  | 'family'
  | 'health'
  | 'provision'
  | 'guidance'
  | 'protection'
  | 'ministry'
  | 'breakthrough'
  | 'thanksgiving'
  | 'intercession';

// ============================================
// SETTINGS TYPES
// ============================================

export interface CoachSettings {
  user_id: string;
  coaching_tone: CoachingTone;
  scripture_translation: BibleTranslation;
  memory_retention_days: number;
  auto_extract_actions: boolean;
  pastoral_mode: boolean;
  pentecostal_guidance: boolean;
  transcription_language: string;
  daily_briefing_time: string | null;
  prayer_reminder_enabled: boolean;
  updated_at: string;
}

export type CoachingTone =
  | 'gentle'
  | 'balanced'
  | 'direct'
  | 'challenging';

export type BibleTranslation =
  | 'KJV'
  | 'NKJV'
  | 'NIV'
  | 'ESV'
  | 'NLT'
  | 'AMP';

// ============================================
// RECORDING STATE TYPES
// ============================================

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
}

export interface TranscriptionState {
  status: 'idle' | 'transcribing' | 'completed' | 'error';
  progress: number;
  transcript: string | null;
  error: string | null;
}

// ============================================
// UI STATE TYPES
// ============================================

export type CoachTab =
  | 'today'
  | 'diary'
  | 'memory'
  | 'action-plans'
  | 'scripture'
  | 'insights'
  | 'settings';

export interface CoachUIState {
  activeTab: CoachTab;
  selectedSessionId: string | null;
  selectedMemoryId: string | null;
  isRecording: boolean;
  isCommandBarOpen: boolean;
  isDrawerOpen: boolean;
  drawerContent: 'session' | 'memory' | 'action' | 'scripture' | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CoachAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WriteReceipt {
  status: 'success' | 'warning' | 'error';
  summary: string;
  created_count: number;
  merged_count: number;
  failed_count: number;
  affected_ids: string[];
  verification_message?: string;
}

export interface ExtractionResult {
  actions: CoachActionItem[];
  memories: Partial<CoachMemory>[];
  scripture: ScriptureReference[];
  coaching: string;
}
