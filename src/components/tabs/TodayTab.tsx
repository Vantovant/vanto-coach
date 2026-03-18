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
import { mockDailyBriefing, mockPrayerRequests, mockActionItems } from '@/data/mock-data';
import { useCrossReferences } from '@/hooks/useCrossReferences';
import { useBibleVerse } from '@/hooks/useBibleVerse';
import { buildScriptureUrlFromReference, buildStudyUrl } from '@/lib/bible/navigation';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function TodayTab() {
  const briefing = mockDailyBriefing;
  const [formattedDate, setFormattedDate] = React.useState('');
  const [greeting, setGreeting] = React.useState('');

  React.useEffect(() => {
    const today = new Date();
    setFormattedDate(format(today, 'EEEE, MMMM d, yyyy'));
    setGreeting(getGreeting());
  }, []);

  // Get the scripture reference string for cross-references
  const scriptureRef = `${briefing.scripture_for_today.book} ${briefing.scripture_for_today.chapter}:${briefing.scripture_for_today.verse_start}`;

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
                {briefing.todays_focus}
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
                {briefing.spiritual_focus}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scripture for Today with Cross-References */}
        <ScriptureForTodayCard
          scripture={briefing.scripture_for_today}
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
              {briefing.top_action_items.map((action, index) => (
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
                        {action.category}
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
                <p className="font-medium text-sm mb-2.5">{briefing.prayer_focus.theme}</p>
                <div className="flex flex-wrap gap-2">
                  {briefing.prayer_focus.areas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs font-normal">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              {briefing.prayer_focus.scripture && (
                <div className="p-3 rounded-lg bg-[hsl(var(--scripture))]/40 border border-accent/15">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {briefing.prayer_focus.scripture.book} {briefing.prayer_focus.scripture.chapter}:
                    {briefing.prayer_focus.scripture.verse_start}
                  </p>
                  <p className="text-sm italic font-serif leading-relaxed">
                    "{briefing.prayer_focus.scripture.text.slice(0, 150)}..."
                  </p>
                </div>
              )}
              <Button variant="outline" className="w-full gap-2">
                <Heart className="h-4 w-4" />
                Start Prayer Time
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pattern Insight */}
        {briefing.pattern_insight && (
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
                {briefing.pattern_insight}
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

        {/* Linked Items from VantoOS Plan */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-semibold">From Your Plan</h2>
            <Link href="/plan">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                Open Plan Hub
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {/* Tasks */}
              {briefing.linked_tasks.map((task) => (
                <Card key={task.id} className="card-premium min-w-[280px] shrink-0 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-primary mb-2.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Task</span>
                    </div>
                    <p className="font-medium text-sm mb-2.5">{task.title}</p>
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <Badge
                          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Meetings */}
              {briefing.linked_meetings.map((meeting) => (
                <Card key={meeting.id} className="card-premium min-w-[280px] shrink-0 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-[hsl(var(--spiritual))] mb-2.5">
                      <Calendar className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Meeting</span>
                    </div>
                    <p className="font-medium text-sm mb-2.5">{meeting.title}</p>
                    {meeting.due_date && (
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {format(new Date(meeting.due_date), 'h:mm a')}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Reminders */}
              {briefing.linked_reminders.map((reminder) => (
                <Card key={reminder.id} className="card-premium min-w-[280px] shrink-0 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-warning mb-2.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Reminder</span>
                    </div>
                    <p className="font-medium text-sm mb-2.5">{reminder.title}</p>
                    {reminder.due_date && (
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {format(new Date(reminder.due_date), 'h:mm a')}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

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
                {mockPrayerRequests.filter(p => p.status === 'active').length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {mockPrayerRequests.filter(p => p.status === 'active').slice(0, 3).map((prayer) => (
                <div key={prayer.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                  <Heart className="h-4 w-4 text-[hsl(var(--spiritual))] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{prayer.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize font-normal">
                        {prayer.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Since {format(new Date(prayer.first_prayed_at), 'MMM d')}
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
          <Button variant="outline" size="sm" className="gap-2">
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
