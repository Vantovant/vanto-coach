'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import {
  X,
  Play,
  Pause,
  Volume2,
  FileText,
  Sparkles,
  BookMarked,
  Target,
  ChevronDown,
  ChevronUp,
  Copy,
  Share2,
  MoreVertical,
  Clock,
  Heart,
  Send,
  Wand2,
  Link2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CoachSession, LifeArea } from '@/types/coach';
import { cn } from '@/lib/utils';
import { getSignedAudioUrl } from '@/lib/supabase/storage';
import { ScriptureList } from '@/components/bible/ScriptureCard';
import { useCrossReferences } from '@/hooks/useCrossReferences';
import { useBibleVerse } from '@/hooks/useBibleVerse';
import { buildScriptureUrlFromReference, buildStudyUrl } from '@/lib/bible/navigation';
import { useRouter } from 'next/navigation';

interface SessionDetailProps {
  session: CoachSession;
  onClose: () => void;
}

export function SessionDetail({ session, onClose }: SessionDetailProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackProgress, setPlaybackProgress] = React.useState(0);
  const [audioDuration, setAudioDuration] = React.useState(session.audio_duration_seconds || 0);
  const [activeTab, setActiveTab] = React.useState<'transcript' | 'coaching' | 'actions'>('transcript');
  const [showFullTranscript, setShowFullTranscript] = React.useState(false);
  // Resolved playback URL (may need signed URL for Supabase Storage paths)
  const [resolvedAudioUrl, setResolvedAudioUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = session.audio_url;
    if (!raw) { setResolvedAudioUrl(null); return; }
    // If it's already a full URL (blob:, http:, https:), use it directly
    if (raw.startsWith('blob:') || raw.startsWith('http')) {
      setResolvedAudioUrl(raw);
    } else {
      // It's a Supabase Storage path — get a signed URL
      getSignedAudioUrl(raw).then(url => setResolvedAudioUrl(url));
    }
  }, [session.audio_url]);

  // Audio playback handling
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setAudioDuration(Math.floor(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [resolvedAudioUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const formatDuration = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="card-elevated h-[calc(100vh-300px)] flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {session.mood && (
                <span className="text-lg">{getMoodEmoji(session.mood)}</span>
              )}
              <Badge variant="secondary" className="text-xs">
                {format(parseISO(session.session_date), 'MMMM d, yyyy')}
              </Badge>
            </div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            {session.summary && (
              <CardDescription className="mt-1 line-clamp-2">
                {session.summary}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Transcript
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Delete Entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Life Areas */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {session.life_areas.map(area => (
            <Badge key={area} variant="outline" className="text-[10px] capitalize">
              {area}
            </Badge>
          ))}
        </div>
      </CardHeader>

      {/* Audio Player */}
      {session.audio_url && (
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
          {/* Hidden audio element — src resolves blob URLs or signed Supabase Storage URLs */}
          <audio
            ref={audioRef}
            src={resolvedAudioUrl ?? undefined}
            preload="metadata"
          />

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <div className="flex-1">
              <div
                className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                onClick={seekAudio}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>
                  {formatDuration(Math.floor((playbackProgress / 100) * audioDuration))}
                </span>
                <span>{formatDuration(audioDuration)}</span>
              </div>
            </div>
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 shrink-0 mx-4 mt-3" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="transcript" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="coaching" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Actions
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0">
          <TabsContent value="transcript" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {/* Raw Transcript */}
                <Collapsible open={showFullTranscript} onOpenChange={setShowFullTranscript}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Original Transcript</h4>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
                        {showFullTranscript ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Expand
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
                      {session.raw_transcript}
                    </div>
                  </CollapsibleContent>
                  {!showFullTranscript && (
                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed line-clamp-4">
                      {session.raw_transcript}
                    </div>
                  )}
                </Collapsible>

                <Separator />

                {/* Cleaned Summary */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Cleaned Summary</h4>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed">
                    {session.cleaned_transcript}
                  </div>
                </div>

                {/* Structured Entry */}
                {session.structured_entry && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Structured Journal</h4>
                      <div className="grid gap-3">
                        {Object.entries(session.structured_entry).map(([key, values]) => {
                          if (!Array.isArray(values) || values.length === 0) return null;
                          return (
                            <StructuredField key={key} field={key} values={values} />
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="coaching" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {/* Coach Response */}
                {session.coach_response && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium">Coaching Insight</h4>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed">
                      {session.coach_response}
                    </div>
                  </div>
                )}

                {/* Biblical Response */}
                {session.biblical_response && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookMarked className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-medium">Biblical Guidance</h4>
                      </div>

                      {/* Primary Verse with Cross-References */}
                      <PrimaryVerseWithCrossRefs
                        verse={session.biblical_response.primary_verse}
                      />

                      {/* Supporting Verses */}
                      {session.biblical_response.supporting_verses.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-muted-foreground">Supporting Verses:</p>
                          {session.biblical_response.supporting_verses.map((verse, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                              <span className="font-medium">
                                {verse.book} {verse.chapter}:{verse.verse_start}
                              </span>
                              <span className="mx-1.5">-</span>
                              <span className="italic text-muted-foreground">
                                "{verse.text.slice(0, 100)}..."
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">Explanation</p>
                          <p className="text-muted-foreground">{session.biblical_response.explanation}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Application</p>
                          <p className="text-muted-foreground">{session.biblical_response.application}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[hsl(var(--spiritual))]/10 border border-[hsl(var(--spiritual))]/20">
                          <p className="font-medium mb-1 flex items-center gap-2">
                            <Heart className="h-3.5 w-3.5 text-[hsl(var(--spiritual))]" />
                            Prayer
                          </p>
                          <p className="text-muted-foreground italic">{session.biblical_response.prayer}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Reflection Question</p>
                          <p className="text-muted-foreground">{session.biblical_response.reflection_question}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <p className="font-medium mb-1 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-success" />
                            Action Step
                          </p>
                          <p className="text-muted-foreground">{session.biblical_response.action_step}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {session.action_status === 'extracted' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Extracted Actions</h4>
                      <Button size="sm" className="gap-2">
                        <Send className="h-3.5 w-3.5" />
                        Send to Plan
                      </Button>
                    </div>
                    {/* Would show extracted actions here */}
                    <div className="p-4 rounded-lg bg-primary/5 text-center">
                      <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium">2 actions extracted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Review and approve actions in the Action Plans tab
                      </p>
                    </div>
                  </>
                ) : session.action_status === 'none' ? (
                  <div className="p-8 text-center">
                    <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium mb-2">No actions extracted yet</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Use AI to extract tasks, reminders, and habits from this entry.
                    </p>
                    <Button className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Extract Actions
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-success/10 text-center">
                    <Target className="h-8 w-8 mx-auto text-success mb-2" />
                    <p className="text-sm font-medium">Actions applied</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View your tasks in VantoOS Plan
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

function StructuredField({ field, values }: { field: string; values: string[] }) {
  const fieldConfig: Record<string, { icon: string; label: string; color: string }> = {
    wins: { icon: '🏆', label: 'Wins', color: 'bg-success/10 border-success/20' },
    struggles: { icon: '⚠️', label: 'Struggles', color: 'bg-warning/10 border-warning/20' },
    fears: { icon: '😰', label: 'Fears', color: 'bg-destructive/10 border-destructive/20' },
    decisions: { icon: '🔨', label: 'Decisions', color: 'bg-primary/10 border-primary/20' },
    people: { icon: '👥', label: 'People', color: 'bg-muted border-border' },
    opportunities: { icon: '💡', label: 'Opportunities', color: 'bg-accent/10 border-accent/20' },
    gratitude: { icon: '🙏', label: 'Gratitude', color: 'bg-[hsl(var(--spiritual))]/10 border-[hsl(var(--spiritual))]/20' },
    followups: { icon: '📋', label: 'Follow-ups', color: 'bg-primary/10 border-primary/20' },
    prayer_requests: { icon: '🙏', label: 'Prayer Requests', color: 'bg-[hsl(var(--spiritual))]/10 border-[hsl(var(--spiritual))]/20' },
    scripture_reflections: { icon: '📖', label: 'Scripture Referenced', color: 'bg-[hsl(var(--scripture))]/30 border-accent/20' },
    habits: { icon: '🔄', label: 'Habits', color: 'bg-muted border-border' },
    finances: { icon: '💰', label: 'Finances', color: 'bg-warning/10 border-warning/20' },
    health: { icon: '❤️', label: 'Health', color: 'bg-success/10 border-success/20' },
    calling: { icon: '⭐', label: 'Calling', color: 'bg-accent/10 border-accent/20' },
    relationships: { icon: '💕', label: 'Relationships', color: 'bg-[hsl(var(--spiritual))]/10 border-[hsl(var(--spiritual))]/20' },
    leadership: { icon: '🎯', label: 'Leadership', color: 'bg-primary/10 border-primary/20' },
  };

  const config = fieldConfig[field] || { icon: '📝', label: field, color: 'bg-muted border-border' };

  // Special handling for scripture references - show actual verse text
  if (field === 'scripture_reflections' && values.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <BookMarked className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
        <ScriptureList references={values} compact maxDisplay={5} />
      </div>
    );
  }

  return (
    <div className={cn('p-3 rounded-lg border', config.color)}>
      <div className="flex items-center gap-2 mb-2">
        <span>{config.icon}</span>
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      <ul className="space-y-1">
        {values.map((value, idx) => (
          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-muted-foreground/50">•</span>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Primary Verse with Cross-References Component
interface PrimaryVerseWithCrossRefsProps {
  verse: {
    book: string;
    chapter: number;
    verse_start: number;
    verse_end?: number;
    text: string;
    translation: string;
  };
}

function PrimaryVerseWithCrossRefs({ verse }: PrimaryVerseWithCrossRefsProps) {
  const router = useRouter();
  const [showRelated, setShowRelated] = React.useState(false);
  const verseRef = `${verse.book} ${verse.chapter}:${verse.verse_start}`;
  const crossRefs = useCrossReferences(verseRef);

  const handleViewAllStudy = () => {
    const url = buildStudyUrl(verseRef);
    router.push(url);
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Main Verse */}
      <div className="p-4 rounded-lg bg-[hsl(var(--scripture))]/50 border border-accent/30">
        <p className="text-xs text-muted-foreground mb-1">
          {verse.book} {verse.chapter}:{verse.verse_start}
          {verse.verse_end && `-${verse.verse_end}`}
        </p>
        <blockquote className="text-sm font-serif italic leading-relaxed">
          "{verse.text}"
        </blockquote>
      </div>

      {/* Cross-References */}
      {crossRefs.hasReferences && (
        <Collapsible open={showRelated} onOpenChange={setShowRelated}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3 w-3" />
                Related Verses ({crossRefs.relatedVerses.length})
              </span>
              {showRelated ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              {/* Themes */}
              {crossRefs.themes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {crossRefs.themes.map((theme, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] font-normal capitalize"
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Related Verses */}
              <div className="space-y-1.5">
                {crossRefs.relatedVerses.slice(0, 4).map((ref, idx) => (
                  <CrossRefItem key={idx} reference={ref} />
                ))}
              </div>

              {/* View All - Navigate to Study View */}
              {crossRefs.relatedVerses.length > 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-[10px] gap-1.5 bg-accent/5 border-accent/20 text-accent hover:bg-accent/10"
                  onClick={handleViewAllStudy}
                >
                  <BookMarked className="h-3 w-3" />
                  Study All {crossRefs.relatedVerses.length} Related Verses
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Cross-Reference Item with Hover Preview and Navigation
interface CrossRefItemProps {
  reference: {
    reference: string;
    theme: string;
    relevance: 'direct' | 'thematic' | 'complementary';
  };
}

function CrossRefItem({ reference }: CrossRefItemProps) {
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
          'flex items-start gap-2 p-2 rounded-md transition-all cursor-pointer',
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
                    <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
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

function getMoodEmoji(mood: string): string {
  const moodEmojis: Record<string, string> = {
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
