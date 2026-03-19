'use client';

import * as React from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Sparkles,
  BookMarked,
  CheckCircle2,
  Calendar,
  Volume2,
  Download,
  Share2,
  MoreVertical,
  X,
  Wand2,
  RefreshCw,
  Target,
  Heart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CoachSession, SessionMood, LifeArea } from '@/types/coach';
import { useSessions } from '@/hooks/useSessions';
import { createSession } from '@/lib/supabase/db';
import { uploadAudio } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';
import { VoiceRecorder, type ExtendedRecordingResult } from '@/components/diary/VoiceRecorder';
import { SessionDetail } from '@/components/diary/SessionDetail';

export function DiaryTab() {
  const [selectedSession, setSelectedSession] = React.useState<CoachSession | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMood, setFilterMood] = React.useState<SessionMood | 'all'>('all');
  const [showRecorder, setShowRecorder] = React.useState(false);

  const { sessions, loading: sessionsLoading, error: sessionsError, prependSession } = useSessions();

  const allSessions = sessions;

  const handleRecordingComplete = React.useCallback(async (result: ExtendedRecordingResult | null) => {
    if (result) {
      const hasTranscript = result.transcript && result.transcript.trim().length > 0;
      const hasProcessedData = !!(result.summary && result.summary.length > 0);

      // 1. Upload audio to Supabase Storage
      let storedAudioUrl: string | null = result.audioUrl;
      if (result.audioBlob) {
        const storagePath = await uploadAudio(result.audioBlob, result.mimeType || 'audio/webm');
        if (storagePath) {
          storedAudioUrl = storagePath; // store the path; signed URL is generated at play time
        }
      }

      // 2. Map key topics → life areas
      const lifeAreas: LifeArea[] = (result.keyTopics || [])
        .map(topic => topic.toLowerCase() as LifeArea)
        .filter(area => [
          'faith', 'family', 'marriage', 'parenting', 'health', 'fitness',
          'business', 'career', 'finances', 'relationships', 'ministry',
          'leadership', 'personal_growth', 'rest', 'calling'
        ].includes(area))
        .slice(0, 5);

      // 3. Build structured entry
      const structuredEntry = (result.actionItems?.length || result.prayerPoints?.length) ? {
        wins: [],
        struggles: [],
        fears: [],
        decisions: [],
        people: [],
        opportunities: [],
        gratitude: [],
        followups: result.actionItems || [],
        prayer_requests: result.prayerPoints || [],
        scripture_reflections: [],
        habits: [],
        finances: [],
        health: [],
        calling: [],
        relationships: [],
        leadership: [],
      } : null;

      // 4. Persist to Supabase
      const saved = await createSession({
        title: `Voice Entry - ${format(new Date(), 'MMMM d, h:mm a')}`,
        session_date: format(new Date(), 'yyyy-MM-dd'),
        audio_url: storedAudioUrl,
        audio_duration_seconds: result.duration,
        raw_transcript: hasTranscript ? result.transcript : null,
        cleaned_transcript: result.cleanedTranscript || (hasTranscript ? result.transcript : null),
        summary: result.summary || (hasTranscript ? result.transcript.slice(0, 150) + (result.transcript.length > 150 ? '...' : '') : 'New recording - processing...'),
        mood: result.mood || null,
        sentiment_score: result.mood ? getMoodSentiment(result.mood) : null,
        life_areas: lifeAreas,
        spiritual_topics: result.prayerPoints?.length ? ['prayer'] : [],
        coach_response: hasProcessedData ? 'AI analysis complete. Review your insights below.' : null,
        action_status: result.actionItems?.length ? 'extracted' : (hasTranscript ? 'pending' : 'none'),
        structured_entry: structuredEntry,
        action_items: result.actionItems?.map(title => ({
          title,
          action_type: 'task',
          priority: 'medium',
          category: null,
        })),
        prayer_points: result.prayerPoints?.map(content => ({
          content,
          category: null,
        })),
      });

      // 5. Optimistic local update (use saved row or build a local placeholder)
      const sessionToShow: CoachSession = saved ?? {
        id: `session-local-${Date.now()}`,
        user_id: '',
        title: `Voice Entry - ${format(new Date(), 'MMMM d, h:mm a')}`,
        session_date: format(new Date(), 'yyyy-MM-dd'),
        audio_url: storedAudioUrl,
        audio_duration_seconds: result.duration,
        raw_transcript: hasTranscript ? result.transcript : null,
        cleaned_transcript: result.cleanedTranscript || (hasTranscript ? result.transcript : null),
        summary: result.summary || 'New recording - processing...',
        mood: (result.mood as SessionMood) || null,
        sentiment_score: result.mood ? getMoodSentiment(result.mood) : null,
        life_areas: lifeAreas,
        spiritual_topics: result.prayerPoints?.length ? ['prayer'] : [],
        coach_response: hasProcessedData ? 'AI analysis complete. Review your insights below.' : null,
        biblical_response: null,
        action_status: result.actionItems?.length ? 'extracted' : (hasTranscript ? 'pending' : 'none'),
        structured_entry: structuredEntry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      prependSession(sessionToShow);
      setSelectedSession(sessionToShow);
    }
    setShowRecorder(false);
  }, [prependSession]);

  const filteredSessions = React.useMemo(() => {
    return allSessions.filter(session => {
      const matchesSearch = searchQuery === '' ||
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.raw_transcript?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = filterMood === 'all' || session.mood === filterMood;
      return matchesSearch && matchesMood;
    });
  }, [searchQuery, filterMood, allSessions]);

  const groupedSessions = React.useMemo(() => {
    const groups: { [key: string]: CoachSession[] } = {};
    filteredSessions.forEach(session => {
      const date = parseISO(session.session_date);
      let key: string;
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else key = format(date, 'MMMM d, yyyy');

      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    return groups;
  }, [filteredSessions]);

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-accent/[0.02]" />
        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Voice Diary</h1>
              <p className="text-muted-foreground mt-1.5">
                Speak freely. Every word is preserved and transformed into wisdom.
              </p>
            </div>
            <Button
              onClick={() => setShowRecorder(true)}
              className="gap-2 shadow-sm animate-fade-in"
              size="lg"
              style={{ animationDelay: '100ms' }}
            >
              <Mic className="h-5 w-5" />
              Record New Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Session List */}
          <div className="lg:w-[400px] space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setFilterMood('all')}>
                    All Moods
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {['grateful', 'hopeful', 'peaceful', 'anxious', 'stressed', 'overwhelmed'].map(mood => (
                    <DropdownMenuItem
                      key={mood}
                      onClick={() => setFilterMood(mood as SessionMood)}
                      className="capitalize"
                    >
                      {getMoodEmoji(mood as SessionMood)} {mood}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Sessions List */}
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-6 pr-4">
                {/* Loading state */}
                {sessionsLoading && (
                  <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading entries…</span>
                  </div>
                )}
                {/* Error state */}
                {sessionsError && !sessionsLoading && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{sessionsError}</p>
                  </div>
                )}
                {Object.entries(groupedSessions).map(([date, sessions]) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                    <div className="space-y-2">
                      {sessions.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          isSelected={selectedSession?.id === session.id}
                          onClick={() => setSelectedSession(session)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No entries found</p>
                    <Button
                      variant="link"
                      onClick={() => setShowRecorder(true)}
                      className="mt-2"
                    >
                      Record your first entry
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Session Detail */}
          <div className="flex-1">
            {selectedSession ? (
              <SessionDetail
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
              />
            ) : (
              <Card className="h-[calc(100vh-300px)] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Entry</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Choose a diary entry from the list to view the full transcript,
                    coaching insights, and biblical guidance.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Recording Dialog */}
      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="h-4 w-4 text-primary" />
              </div>
              Record Voice Entry
            </DialogTitle>
            <DialogDescription>
              Speak freely about your day, thoughts, struggles, or gratitude.
              Your words will be preserved, transcribed, and transformed into wisdom.
            </DialogDescription>
          </DialogHeader>
          <VoiceRecorder
            onComplete={handleRecordingComplete}
            onCancel={() => setShowRecorder(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionCard({
  session,
  isSelected,
  onClick
}: {
  session: CoachSession;
  isSelected: boolean;
  onClick: () => void;
}) {
  // Check for AI-processed content
  const hasActionItems = session.structured_entry?.followups && session.structured_entry.followups.length > 0;
  const hasPrayerPoints = session.structured_entry?.prayer_requests && session.structured_entry.prayer_requests.length > 0;
  const isAIProcessed = session.coach_response || hasActionItems || hasPrayerPoints;
  const actionCount = session.structured_entry?.followups?.length || 0;
  const prayerCount = session.structured_entry?.prayer_requests?.length || 0;

  return (
    <Card
      className={cn(
        'card-premium cursor-pointer transition-all group',
        isSelected && 'ring-2 ring-primary',
        isAIProcessed && 'border-l-2 border-l-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Top badges row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {session.audio_url && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Volume2 className="h-3 w-3" />
                  {formatDuration(session.audio_duration_seconds || 0)}
                </Badge>
              )}
              {session.mood && (
                <Badge variant="outline" className="text-[10px] gap-1 capitalize">
                  <span>{getMoodEmoji(session.mood)}</span>
                  {session.mood}
                </Badge>
              )}
              {isAIProcessed && (
                <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-0">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>

            {/* Title */}
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {session.title}
            </h4>

            {/* Summary */}
            {session.summary && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {session.summary}
              </p>
            )}

            {/* Insights row - Action items and Prayer points */}
            {(hasActionItems || hasPrayerPoints) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed">
                {hasActionItems && (
                  <span className="text-[10px] text-success flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {actionCount} action{actionCount > 1 ? 's' : ''}
                  </span>
                )}
                {hasPrayerPoints && (
                  <span className="text-[10px] text-[hsl(var(--spiritual))] flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {prayerCount} prayer{prayerCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Life areas / Topics */}
            {session.life_areas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {session.life_areas.slice(0, 3).map(area => (
                  <Badge key={area} variant="outline" className="text-[10px] capitalize font-normal">
                    {area}
                  </Badge>
                ))}
                {session.life_areas.length > 3 && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    +{session.life_areas.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Time */}
          <div className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
            {format(parseISO(session.created_at), 'h:mm a')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getMoodEmoji(mood: SessionMood): string {
  const moodEmojis: Record<SessionMood, string> = {
    grateful: '🙏',
    hopeful: '🌟',
    peaceful: '☮️',
    joyful: '😊',
    reflective: '🤔',
    anxious: '😰',
    stressed: '😓',
    confused: '😕',
    grieving: '😢',
    frustrated: '😤',
    discouraged: '😞',
    overwhelmed: '😵',
    determined: '💪',
    convicted: '⚡',
    neutral: '😐',
  };
  return moodEmojis[mood] || '📝';
}

function getMoodSentiment(mood: string): number {
  const sentiments: Record<string, number> = {
    grateful: 0.9,
    hopeful: 0.8,
    peaceful: 0.85,
    joyful: 0.95,
    reflective: 0.6,
    anxious: 0.3,
    stressed: 0.25,
    confused: 0.4,
    grieving: 0.2,
    frustrated: 0.3,
    discouraged: 0.25,
    overwhelmed: 0.2,
    determined: 0.75,
    convicted: 0.65,
    neutral: 0.5,
  };
  return sentiments[mood] || 0.5;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
