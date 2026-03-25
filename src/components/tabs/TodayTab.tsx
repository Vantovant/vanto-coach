'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Sun,
  BookOpen,
  Target,
  Heart,
  BookMarked,
  Mic,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Play,
  ArrowRight,
  Link2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCrossReferences } from '@/hooks/useCrossReferences';
import { useBibleVerse } from '@/hooks/useBibleVerse';
import { buildScriptureUrlFromReference, buildStudyUrl } from '@/lib/bible/navigation';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getActionItems, getPrayerPoints, getRecentSessions, type PrayerPointRow } from '@/lib/supabase/db';
import type { CoachActionItem, CoachSession } from '@/types/coach';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ─── Scripture verse pool, tagged by theme ────────────────────────────────────
// Each verse carries tags matching mood keywords, life areas, and spiritual topics.
// getContextVerse() scores the pool against real session signals.
type TaggedVerse = {
  book: string; chapter: number; verse_start: number; verse_end?: number;
  text: string; translation: string;
  tags: string[];
};
const VERSE_POOL: TaggedVerse[] = [
  { book: 'Proverbs', chapter: 3, verse_start: 5, verse_end: 6, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', translation: 'KJV', tags: ['anxious', 'stressed', 'confused', 'guidance', 'faith', 'decisions'] },
  { book: 'Philippians', chapter: 4, verse_start: 13, text: 'I can do all things through Christ which strengtheneth me.', translation: 'KJV', tags: ['overwhelmed', 'discouraged', 'business', 'leadership', 'strength', 'determined'] },
  { book: 'Isaiah', chapter: 40, verse_start: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', translation: 'KJV', tags: ['tired', 'overwhelmed', 'health', 'rest', 'renewal', 'faith'] },
  { book: 'Jeremiah', chapter: 29, verse_start: 11, text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', translation: 'KJV', tags: ['anxious', 'worried', 'future', 'calling', 'hopeful', 'purpose'] },
  { book: 'Romans', chapter: 8, verse_start: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', translation: 'KJV', tags: ['discouraged', 'frustrated', 'calling', 'faith', 'trust', 'growth'] },
  { book: 'Psalm', chapter: 46, verse_start: 1, text: 'God is our refuge and strength, a very present help in trouble.', translation: 'KJV', tags: ['anxious', 'stressed', 'overwhelmed', 'family', 'finances', 'crisis'] },
  { book: 'Matthew', chapter: 6, verse_start: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', translation: 'KJV', tags: ['finances', 'business', 'provision', 'priorities', 'prayer'] },
  { book: '2 Timothy', chapter: 1, verse_start: 7, text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', translation: 'KJV', tags: ['anxious', 'afraid', 'worried', 'leadership', 'courage', 'fear'] },
  { book: 'Psalm', chapter: 23, verse_start: 1, text: 'The LORD is my shepherd; I shall not want.', translation: 'KJV', tags: ['peaceful', 'provision', 'finances', 'grateful', 'faith', 'rest'] },
  { book: 'Colossians', chapter: 3, verse_start: 23, text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.', translation: 'KJV', tags: ['business', 'work', 'leadership', 'calling', 'excellence', 'determined'] },
  { book: 'Galatians', chapter: 5, verse_start: 22, verse_end: 23, text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.', translation: 'KJV', tags: ['frustrated', 'angry', 'spiritual', 'growth', 'relationships', 'self-control'] },
  { book: 'Psalm', chapter: 37, verse_start: 4, text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.', translation: 'KJV', tags: ['hopeful', 'joyful', 'grateful', 'faith', 'purpose', 'calling'] },
  { book: 'Philippians', chapter: 4, verse_start: 6, verse_end: 7, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', translation: 'KJV', tags: ['anxious', 'worried', 'prayer', 'stress', 'peace', 'spiritual'] },
  { book: 'James', chapter: 1, verse_start: 5, text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.', translation: 'KJV', tags: ['confused', 'decisions', 'guidance', 'leadership', 'business', 'wisdom'] },
  { book: '1 Peter', chapter: 5, verse_start: 7, text: 'Casting all your care upon him; for he careth for you.', translation: 'KJV', tags: ['anxious', 'stressed', 'overwhelmed', 'prayer', 'burden', 'family'] },
  { book: 'Romans', chapter: 12, verse_start: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.', translation: 'KJV', tags: ['growth', 'spiritual', 'faith', 'renewal', 'calling', 'transformation'] },
  { book: 'Psalm', chapter: 119, verse_start: 105, text: 'Thy word is a lamp unto my feet, and a light unto my path.', translation: 'KJV', tags: ['confused', 'guidance', 'decisions', 'faith', 'scripture', 'spiritual'] },
  { book: 'Isaiah', chapter: 41, verse_start: 10, text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.', translation: 'KJV', tags: ['anxious', 'afraid', 'overwhelmed', 'business', 'strength', 'courage'] },
  { book: 'Hebrews', chapter: 11, verse_start: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', translation: 'KJV', tags: ['hopeful', 'faith', 'calling', 'uncertain', 'trust', 'spiritual'] },
  { book: 'Proverbs', chapter: 16, verse_start: 3, text: 'Commit thy works unto the LORD, and thy thoughts shall be established.', translation: 'KJV', tags: ['business', 'leadership', 'planning', 'calling', 'work', 'decisions'] },
  { book: 'Matthew', chapter: 11, verse_start: 28, text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', translation: 'KJV', tags: ['tired', 'overwhelmed', 'stressed', 'rest', 'burnout', 'health'] },
  { book: 'John', chapter: 14, verse_start: 27, text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', translation: 'KJV', tags: ['anxious', 'worried', 'afraid', 'peace', 'spiritual', 'relationships'] },
  { book: 'Philippians', chapter: 4, verse_start: 19, text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.', translation: 'KJV', tags: ['finances', 'provision', 'worried', 'family', 'trust', 'prayer'] },
  { book: 'Proverbs', chapter: 11, verse_start: 14, text: 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.', translation: 'KJV', tags: ['leadership', 'decisions', 'business', 'guidance', 'team', 'wisdom'] },
  { book: 'Ephesians', chapter: 6, verse_start: 10, text: 'Finally, my brethren, be strong in the Lord, and in the power of his might.', translation: 'KJV', tags: ['discouraged', 'spiritual', 'strength', 'battle', 'leadership', 'faith'] },
  { book: 'Joshua', chapter: 1, verse_start: 9, text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', translation: 'KJV', tags: ['discouraged', 'afraid', 'new', 'calling', 'leadership', 'courage'] },
  { book: 'Psalm', chapter: 27, verse_start: 1, text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?', translation: 'KJV', tags: ['afraid', 'uncertain', 'faith', 'strength', 'trust', 'courage'] },
  { book: 'Ecclesiastes', chapter: 4, verse_start: 9, verse_end: 10, text: 'Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow.', translation: 'KJV', tags: ['relationships', 'family', 'marriage', 'team', 'lonely', 'community'] },
  { book: 'Proverbs', chapter: 18, verse_start: 21, text: 'Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.', translation: 'KJV', tags: ['relationships', 'leadership', 'communication', 'conflict', 'growth', 'family'] },
  { book: 'Psalm', chapter: 1, verse_start: 1, verse_end: 2, text: 'Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful. But his delight is in the law of the LORD; and in his law doth he meditate day and night.', translation: 'KJV', tags: ['spiritual', 'faith', 'growth', 'meditation', 'scripture', 'calling'] },
];

/**
 * Score each verse against signals from recent sessions, prayer points, and actions.
 * Returns the highest-scoring verse, falling back to a day-of-year default.
 */
function getContextVerse(
  recentSessions: CoachSession[],
  prayerPoints: PrayerPointRow[],
  actionItems: CoachActionItem[]
): TaggedVerse {
  // Collect context signals
  const signals: string[] = [];
  for (const s of recentSessions.slice(0, 3)) {
    if (s.mood) signals.push(s.mood);
    (s.life_areas ?? []).forEach(a => signals.push(a));
    (s.spiritual_topics ?? []).forEach(t => signals.push(t));
  }
  if (actionItems.length >= 3) signals.push('business', 'planning');
  if (prayerPoints.length > 0) signals.push('prayer');

  if (signals.length === 0) {
    // No sessions yet — use day-of-year rotation as fallback
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return VERSE_POOL[dayOfYear % VERSE_POOL.length];
  }

  // Score each verse by tag overlap with context signals
  const signalSet = new Set(signals.map(s => s.toLowerCase()));
  let bestVerse = VERSE_POOL[0];
  let bestScore = -1;
  for (const verse of VERSE_POOL) {
    const score = verse.tags.filter(t => signalSet.has(t)).length;
    if (score > bestScore) { bestScore = score; bestVerse = verse; }
  }
  return bestVerse;
}

// ─── Briefing derivation from multiple recent sessions ────────────────────────
function deriveBriefing(
  recentSessions: CoachSession[],
  actionItems: CoachActionItem[],
  prayerPoints: PrayerPointRow[]
) {
  const hour = new Date().getHours();
  const greetingWord = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const latest = recentSessions[0] ?? null;

  // ── Greeting — specific, grounded, never pastes a raw summary ──────────────
  let greeting: string;
  if (!latest) {
    greeting = `Good ${greetingWord}. Record your first diary entry to begin your coaching journey.`;
  } else {
    const moodNote = latest.mood ? ` You entered your last session feeling ${latest.mood}.` : '';
    const pendingCount = actionItems.filter(a => a.status === 'pending').length;
    const pendingNote = pendingCount > 0 ? ` You have ${pendingCount} pending action${pendingCount > 1 ? 's' : ''} to carry forward.` : '';
    greeting = `Good ${greetingWord}.${moodNote}${pendingNote}`;
  }

  // ── Today's Focus — derived from the most active life area across sessions ──
  const areaCounts: Record<string, number> = {};
  for (const s of recentSessions.slice(0, 5)) {
    for (const area of (s.life_areas ?? [])) {
      areaCounts[area] = (areaCounts[area] ?? 0) + 1;
    }
  }
  const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 2);
  const criticalAction = actionItems.find(a => a.priority === 'critical' && a.status === 'pending');

  let todaysFocus: string;
  if (criticalAction) {
    todaysFocus = `Your most critical commitment today: "${criticalAction.title}". Make it the first thing you address.`;
  } else if (topAreas.length > 0) {
    todaysFocus = `Across your recent entries, ${topAreas.join(' and ')} have surfaced most. Bring deliberate focus to ${topAreas[0]} today.`;
  } else {
    todaysFocus = 'Be present and intentional in every area of your life today.';
  }

  // ── Spiritual Focus — built from recurring spiritual themes across sessions ─
  const topicCounts: Record<string, number> = {};
  for (const s of recentSessions.slice(0, 5)) {
    for (const t of (s.spiritual_topics ?? [])) {
      topicCounts[t] = (topicCounts[t] ?? 0) + 1;
    }
  }
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 2);

  let spiritualFocus: string;
  if (topTopics.length > 0) {
    spiritualFocus = `Your recent entries have centred on ${topTopics.join(' and ')}. Let these guide your prayer and devotion today.`;
  } else if (prayerPoints.length > 0) {
    spiritualFocus = `You have ${prayerPoints.length} active prayer request${prayerPoints.length > 1 ? 's' : ''}. Bring them before God specifically this morning.`;
  } else {
    spiritualFocus = 'Begin today with prayer and Scripture before anything else.';
  }

  // ── Top actions — prioritised, pending or approved only ────────────────────
  const topActionItems = actionItems
    .filter(a => a.status === 'pending' || a.status === 'approved')
    .sort((a, b) => {
      const pri = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pri[a.priority as keyof typeof pri] ?? 2) - (pri[b.priority as keyof typeof pri] ?? 2);
    })
    .slice(0, 3)
    .map(a => ({ title: a.title, priority: a.priority, category: a.category, due_date: a.due_date }));

  // ── Prayer areas — content-first, not just categories ──────────────────────
  const prayerAreas = prayerPoints.slice(0, 3).map(p =>
    p.category ? p.category : p.content.slice(0, 35).replace(/\s+$/, '') + (p.content.length > 35 ? '…' : '')
  );

  const prayerTheme = prayerPoints.length > 0
    ? `You have ${prayerPoints.length} active prayer ${prayerPoints.length === 1 ? 'request' : 'requests'}. Bring each one to God with expectation today.`
    : 'Bring your needs and gratitude before God in prayer today.';

  // ── Pattern insight — compare mood across recent sessions for real contrast ─
  let patternInsight: string | null = null;
  if (recentSessions.length >= 2) {
    const moods = recentSessions.slice(0, 5).map(s => s.mood).filter(Boolean) as string[];
    const positive = ['grateful', 'joyful', 'hopeful', 'peaceful', 'determined', 'confident', 'encouraged'];
    const negative = ['anxious', 'stressed', 'overwhelmed', 'discouraged', 'frustrated', 'confused', 'worried'];
    const posCount = moods.filter(m => positive.includes(m)).length;
    const negCount = moods.filter(m => negative.includes(m)).length;
    if (negCount > posCount && negCount >= 2) {
      patternInsight = `Your last ${moods.length} entries show a recurring ${recentSessions[0]?.mood ?? 'challenging'} pattern. This is worth bringing intentionally to prayer and reflection.`;
    } else if (posCount > negCount && posCount >= 2) {
      patternInsight = `Your recent entries reflect consistent ${recentSessions[0]?.mood ?? 'positive'} momentum. Protect the habits and conditions creating it.`;
    } else if (latest?.mood) {
      patternInsight = `Your most recent entry was recorded with a ${latest.mood} disposition. Reflect on what shaped it.`;
    }
  } else if (latest?.mood) {
    patternInsight = `Your most recent entry was recorded with a ${latest.mood} disposition. Reflect on what shaped it.`;
  }

  return { greeting, todaysFocus, spiritualFocus, topActionItems, prayerAreas, prayerTheme, patternInsight };
}

export function TodayTab() {
  const { user } = useAuth();
  const [formattedDate, setFormattedDate] = React.useState('');
  const [greeting, setGreeting] = React.useState('');
  const [actionItems, setActionItems] = React.useState<CoachActionItem[]>([]);
  const [prayerPoints, setPrayerPoints] = React.useState<PrayerPointRow[]>([]);
  const [recentSessions, setRecentSessions] = React.useState<CoachSession[]>([]);

  React.useEffect(() => {
    const today = new Date();
    setFormattedDate(format(today, 'EEEE, MMMM d, yyyy'));
    setGreeting(getGreeting());
  }, []);

  React.useEffect(() => {
    if (!user) return;
    getActionItems().then(setActionItems);
    getPrayerPoints('active').then(setPrayerPoints);
    // Load only the 5 most recent sessions — no need to fetch full history
    getRecentSessions(5).then(setRecentSessions);
  }, [user]);

  // Derive all briefing content from real persisted data (multi-session)
  const briefing = React.useMemo(
    () => deriveBriefing(recentSessions, actionItems, prayerPoints),
    [recentSessions, actionItems, prayerPoints]
  );

  // Context-aware verse — scored against real session signals
  const dailyVerse = React.useMemo(
    () => getContextVerse(recentSessions, prayerPoints, actionItems),
    [recentSessions, prayerPoints, actionItems]
  );

  // Get the scripture reference string for cross-references
  const scriptureRef = `${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse_start}`;

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.04]" />
        <div className="container max-w-6xl mx-auto px-4 py-10 md:py-14 relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 animate-fade-in">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <Calendar className="h-4 w-4" />
                <span className="tracking-wide">{formattedDate}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-foreground mb-4">
                {greeting}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {briefing.greeting}
              </p>

            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <Link href="/coach?tab=diary&record=true">
                <Button size="lg" className="gap-2 shadow-sm">
                  <Mic className="h-4 w-4" />
                  Record Entry
                </Button>
              </Link>
              <Link href="/coach?tab=scripture">
                <Button variant="outline" size="lg" className="gap-2">
                  <BookMarked className="h-4 w-4" />
                  Open Bible
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Focus Cards */}
        <div className="grid gap-5 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
          {/* Daily Focus */}
          <Card className="card-elevated group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5 text-primary">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold">Today's Focus</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {briefing.todaysFocus}
              </p>
            </CardContent>
          </Card>

          {/* Spiritual Focus */}
          <Card className="card-elevated border-l-[3px] border-l-[hsl(var(--spiritual))] group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5 text-[hsl(var(--spiritual))]">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--spiritual))]/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold">Spiritual Focus</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {briefing.spiritualFocus}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scripture for Today with Cross-References */}
        <ScriptureForTodayCard
          scripture={dailyVerse}
          scriptureRef={scriptureRef}
        />

        {/* Top 3 Actions & Prayer Focus */}
        <div className="grid gap-5 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
          {/* Top Actions */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">Top 3 Actions</CardTitle>
                </div>
                <Link href="/coach?tab=action-plans">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                    View All
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {briefing.topActionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No pending actions yet. Record a diary entry to generate action items.
                </p>
              ) : briefing.topActionItems.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group cursor-pointer"
                >
                  <div className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
                    ${action.priority === 'critical' ? 'bg-destructive text-destructive-foreground' :
                      action.priority === 'high' ? 'bg-warning text-warning-foreground' :
                      'bg-primary text-primary-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-foreground transition-colors">{action.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize font-normal">
                        {action.category ?? 'general'}
                      </Badge>
                      {action.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(action.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Prayer Focus */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--spiritual))]/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[hsl(var(--spiritual))]" />
                </div>
                <CardTitle className="text-base font-semibold">Prayer Focus</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-sm mb-2.5">{briefing.prayerTheme}</p>
                {briefing.prayerAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {briefing.prayerAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs font-normal">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => toast.info('Guided prayer time coming soon')}
              >
                <Heart className="h-4 w-4" />
                Start Prayer Time
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pattern Insight — only shown when there's a real session to derive from */}
        {briefing.patternInsight && (
          <Card className="card-premium border-l-[3px] border-l-primary animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Pattern Insight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {briefing.patternInsight}
              </p>
              <Link href="/coach?tab=memory">
                <Button variant="link" size="sm" className="px-0 mt-3 gap-1.5 text-primary">
                  View Memory Patterns
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* All Coach Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold">Your Actions</h2>
              <Link href="/coach?tab=action-plans">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {actionItems.slice(0, 8).map((item) => (
                  <Card key={item.id} className="card-premium min-w-[260px] shrink-0 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-primary mb-2.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Action</span>
                      </div>
                      <p className="font-medium text-sm mb-2.5 line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.priority === 'critical' || item.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {item.priority}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline" className="text-[10px] capitalize font-normal">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Active Prayer Requests */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--spiritual))]/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[hsl(var(--spiritual))]" />
                </div>
                <CardTitle className="text-base font-semibold">Active Prayer Requests</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {prayerPoints.length} active
              </Badge>
            </div>
            {prayerPoints.length > 3 && (
              <p className="text-xs text-muted-foreground mt-1 ml-10">
                Showing 3 of {prayerPoints.length}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {prayerPoints.slice(0, 3).map((prayer) => (
                <div key={prayer.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                  <Heart className="h-4 w-4 text-[hsl(var(--spiritual))] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{prayer.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {prayer.category && (
                        <Badge variant="outline" className="text-[10px] capitalize font-normal">
                          {prayer.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Since {format(new Date(prayer.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Disclaimer */}
        <Card className="bg-muted/30 border-dashed animate-fade-in" style={{ animationDelay: '450ms' }}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Vanto Coach provides spiritual guidance and life coaching.
              For medical, psychological, or emergency concerns, please consult appropriate professionals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Scripture for Today Card with Cross-References
interface ScriptureForTodayCardProps {
  scripture: {
    book: string;
    chapter: number;
    verse_start: number;
    verse_end?: number;
    text: string;
    translation: string;
  };
  scriptureRef: string;
}

function ScriptureForTodayCard({ scripture, scriptureRef }: ScriptureForTodayCardProps) {
  const [showRelated, setShowRelated] = React.useState(false);
  const crossRefs = useCrossReferences(scriptureRef);

  return (
    <Card className="card-elevated overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--scripture))]/40 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <BookMarked className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base font-semibold">Scripture for Today</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {scripture.book} {scripture.chapter}:
            {scripture.verse_start}
            {scripture.verse_end && `-${scripture.verse_end}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <blockquote className="border-l-2 border-accent/60 pl-4 py-1 font-serif text-lg italic text-foreground leading-relaxed">
          "{scripture.text}"
        </blockquote>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('Guided meditation coming soon')}
          >
            <Play className="h-3 w-3" />
            Meditate
          </Button>
          <Link href={`/coach?tab=scripture&book=${scripture.book}&chapter=${scripture.chapter}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              Read Full Chapter
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Cross-References Section */}
        {crossRefs.hasReferences && (
          <>
            <Separator className="my-3" />
            <Collapsible open={showRelated} onOpenChange={setShowRelated}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" />
                    Related Verses ({crossRefs.relatedVerses.length})
                  </span>
                  {showRelated ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <RelatedVersesDisplay crossRefs={crossRefs} scriptureRef={scriptureRef} />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Related Verses Display Component
interface RelatedVersesDisplayProps {
  crossRefs: ReturnType<typeof useCrossReferences>;
  scriptureRef: string;
}

function RelatedVersesDisplay({ crossRefs, scriptureRef }: RelatedVersesDisplayProps) {
  const router = useRouter();

  const handleViewAll = () => {
    const url = buildStudyUrl(scriptureRef);
    router.push(url);
  };

  return (
    <div className="space-y-3">
      {/* Themes */}
      {crossRefs.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {crossRefs.themes.map((theme, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-[10px] font-normal capitalize bg-accent/10 text-accent border-accent/20"
            >
              {theme}
            </Badge>
          ))}
        </div>
      )}

      {/* Related Verses Grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {crossRefs.relatedVerses.slice(0, 4).map((ref, idx) => (
          <RelatedVerseItem key={idx} reference={ref} />
        ))}
      </div>

      {/* View All Button - Navigate to Study View */}
      {crossRefs.relatedVerses.length > 2 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs gap-2 bg-accent/5 border-accent/20 text-accent hover:bg-accent/10 hover:text-accent"
          onClick={handleViewAll}
        >
          <BookMarked className="h-3.5 w-3.5" />
          Study All {crossRefs.relatedVerses.length} Related Verses
          <ChevronRight className="h-3 w-3 ml-auto" />
        </Button>
      )}
    </div>
  );
}

// Individual Related Verse Item
interface RelatedVerseItemProps {
  reference: {
    reference: string;
    theme: string;
    relevance: 'direct' | 'thematic' | 'complementary';
  };
}

function RelatedVerseItem({ reference }: RelatedVerseItemProps) {
  const router = useRouter();
  const [showPreview, setShowPreview] = React.useState(false);
  const { passage, isLoading } = useBibleVerse(showPreview ? reference.reference : null);

  const handleClick = () => {
    const url = buildScriptureUrlFromReference(reference.reference);
    if (url) {
      router.push(url);
    }
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div
        className={cn(
          'flex items-start gap-2.5 p-2.5 rounded-lg transition-all cursor-pointer',
          'bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-accent/30',
          'hover:shadow-sm active:scale-[0.99]'
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <div className={cn(
          'h-1.5 w-1.5 rounded-full mt-1.5 shrink-0',
          reference.relevance === 'direct' && 'bg-accent',
          reference.relevance === 'thematic' && 'bg-primary',
          reference.relevance === 'complementary' && 'bg-muted-foreground'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium group-hover:text-accent transition-colors">
            {reference.reference}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">{reference.theme}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] font-normal capitalize shrink-0 transition-colors',
            reference.relevance === 'direct' && 'border-accent/50 text-accent group-hover:bg-accent/10',
            reference.relevance === 'thematic' && 'border-primary/50 text-primary group-hover:bg-primary/10',
            reference.relevance === 'complementary' && 'border-muted-foreground/50 group-hover:bg-muted'
          )}
        >
          {reference.relevance}
        </Badge>
      </div>

      {/* Hover Preview */}
      {showPreview && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 animate-fade-in pointer-events-none">
          <Card className="border shadow-lg bg-card">
            <CardContent className="p-3">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : passage ? (
                <>
                  <p className="text-xs font-medium text-accent mb-1">{passage.reference}</p>
                  <p className="text-xs font-serif italic leading-relaxed line-clamp-3">
                    "{passage.text}"
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Click to open in Scripture
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Could not load verse</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
