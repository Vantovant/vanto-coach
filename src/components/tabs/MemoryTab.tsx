'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Pin,
  Archive,
  ArchiveRestore,
  BookMarked,
  Target,
  AlertCircle,
  CheckCircle2,
  Heart,
  Lightbulb,
  Users,
  Briefcase,
  Wallet,
  Activity,
  Sparkles,
  Search,
  Filter,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CoachMemory, MemoryType } from '@/types/coach';
import { cn } from '@/lib/utils';
import { getMemories, getArchivedMemories, patchMemory } from '@/lib/supabase/db';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { captureError } from '@/lib/monitoring';

export function MemoryTab() {
  const { user } = useAuth();
  const [filterType, setFilterType] = React.useState<MemoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [view, setView] = React.useState<'cards' | 'timeline'>('cards');
  const [activeSection, setActiveSection] = React.useState<'active' | 'archived'>('active');
  const [memories, setMemories] = React.useState<CoachMemory[]>([]);
  const [archivedMemories, setArchivedMemories] = React.useState<CoachMemory[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingArchived, setLoadingArchived] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMemories().then(data => { setMemories(data); setLoading(false); });
  }, [user]);

  const archivedLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (activeSection !== 'archived' || archivedLoadedRef.current || !user) return;
    archivedLoadedRef.current = true;
    setLoadingArchived(true);
    getArchivedMemories().then(data => { setArchivedMemories(data); setLoadingArchived(false); });
  }, [activeSection, user]);

  const filteredMemories = React.useMemo(() => {
    return memories.filter(memory => {
      const matchesSearch = searchQuery === '' ||
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || memory.memory_type === filterType;
      return matchesSearch && matchesType && !memory.is_archived;
    });
  }, [searchQuery, filterType, memories]);

  const filteredArchived = React.useMemo(() => {
    return archivedMemories.filter(memory => {
      const matchesSearch = searchQuery === '' ||
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || memory.memory_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, filterType, archivedMemories]);

  const pinnedMemories = filteredMemories.filter(m => m.is_pinned);
  const regularMemories = filteredMemories.filter(m => !m.is_pinned);

  const handlePin = React.useCallback(async (memory: CoachMemory) => {
    const newPinned = !memory.is_pinned;
    setMemories(prev => prev.map(m => m.id === memory.id ? { ...m, is_pinned: newPinned } : m));
    try {
      const updated = await patchMemory(memory.id, { is_pinned: newPinned });
      if (!updated) throw new Error('patchMemory returned null');
      toast.success(newPinned ? 'Memory pinned' : 'Memory unpinned');
    } catch (err) {
      setMemories(prev => prev.map(m => m.id === memory.id ? { ...m, is_pinned: memory.is_pinned } : m));
      captureError(err, { context: 'memory:pin', memoryId: memory.id });
      toast.error(newPinned ? 'Failed to pin memory' : 'Failed to unpin memory', {
        description: 'Please try again.',
      });
    }
  }, []);

  const handleArchive = React.useCallback(async (memory: CoachMemory) => {
    setMemories(prev => prev.filter(m => m.id !== memory.id));
    try {
      const updated = await patchMemory(memory.id, { is_archived: true });
      if (!updated) throw new Error('patchMemory returned null');
      setArchivedMemories(prev => [{ ...memory, is_archived: true }, ...prev]);
      toast.success('Memory archived');
    } catch (err) {
      setMemories(prev => [memory, ...prev]);
      captureError(err, { context: 'memory:archive', memoryId: memory.id });
      toast.error('Failed to archive memory', { description: 'Please try again.' });
    }
  }, []);

  const handleUnarchive = React.useCallback(async (memory: CoachMemory) => {
    setArchivedMemories(prev => prev.filter(m => m.id !== memory.id));
    try {
      const updated = await patchMemory(memory.id, { is_archived: false });
      if (!updated) throw new Error('patchMemory returned null');
      setMemories(prev => [{ ...memory, is_archived: false }, ...prev]);
      toast.success('Memory restored');
    } catch (err) {
      setArchivedMemories(prev => [memory, ...prev]);
      captureError(err, { context: 'memory:unarchive', memoryId: memory.id });
      toast.error('Failed to restore memory', { description: 'Please try again.' });
    }
  }, []);

  return (
    <div className="pb-24 md:pb-8">
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--spiritual))]/[0.02] via-transparent to-primary/[0.02]" />
        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                Memory & Patterns
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Your life patterns, growth insights, and recurring themes over time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={view} onValueChange={(v) => setView(v as 'cards' | 'timeline')}>
                <TabsList className="h-9">
                  <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('recurring_struggle')}>Recurring Struggles</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('recurring_victory')}>Recurring Victories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('pattern_behavior')}>Behavior Patterns</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('pattern_spiritual')}>Spiritual Patterns</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('prayer_burden')}>Prayer Burdens</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as 'active' | 'archived')}>
          <TabsList className="h-9">
            <TabsTrigger value="active" className="text-xs gap-1.5">
              Active
              {memories.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{memories.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs gap-1.5">
              <Archive className="h-3 w-3" />
              Archived
              {archivedMemories.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{archivedMemories.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-6">
            {pinnedMemories.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Pin className="h-4 w-4 text-primary" />
                  Pinned Memories
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pinnedMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} onPin={handlePin} onArchive={handleArchive} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                All Patterns
                <Badge variant="secondary" className="text-xs">{regularMemories.length}</Badge>
              </h2>

              {view === 'cards' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {regularMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} onPin={handlePin} onArchive={handleArchive} />
                  ))}
                </div>
              ) : (
                <MemoryTimeline memories={regularMemories} />
              )}

              {loading && (
                <Card className="card-premium">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading patterns…</p>
                  </CardContent>
                </Card>
              )}
              {!loading && filteredMemories.length === 0 && (
                <Card className="card-premium">
                  <CardContent className="py-12 text-center">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No patterns found yet. Keep journaling to build your memory.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-4 space-y-4">
            {loadingArchived && (
              <Card className="card-premium">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4 animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading archived memories…</p>
                </CardContent>
              </Card>
            )}
            {!loadingArchived && filteredArchived.length === 0 && (
              <Card className="card-premium">
                <CardContent className="py-12 text-center">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No archived memories.</p>
                </CardContent>
              </Card>
            )}
            {!loadingArchived && filteredArchived.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredArchived.map(memory => (
                  <MemoryCard key={memory.id} memory={memory} isArchived onUnarchive={handleUnarchive} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MemoryCard({
  memory,
  isArchived = false,
  onPin,
  onArchive,
  onUnarchive,
}: {
  memory: CoachMemory;
  isArchived?: boolean;
  onPin?: (memory: CoachMemory) => void;
  onArchive?: (memory: CoachMemory) => void;
  onUnarchive?: (memory: CoachMemory) => void;
}) {
  return (
    <Card className="card-premium transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {getMemoryTypeIcon(memory.memory_type)}
            <Badge variant="outline" className="text-[10px] capitalize">
              {memory.memory_type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {memory.is_pinned && !isArchived && <Pin className="h-3 w-3 text-primary" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isArchived && onPin && (
                  <DropdownMenuItem onClick={() => onPin(memory)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {memory.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {!isArchived && onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(memory)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {isArchived && onUnarchive && (
                  <DropdownMenuItem onClick={() => onUnarchive(memory)}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-medium mb-2">{memory.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{memory.summary}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {memory.occurrence_count}x seen
            </span>
            <span>Confidence: {memory.confidence}%</span>
          </div>
          <Progress value={memory.confidence} className="w-16 h-1.5" />
        </div>

        {memory.growth_indicators.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {memory.growth_indicators.map((indicator, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={cn(
                    'text-[10px] gap-1',
                    indicator.direction === 'improving' && 'bg-success/20 text-success',
                    indicator.direction === 'declining' && 'bg-destructive/20 text-destructive'
                  )}
                >
                  {indicator.direction === 'improving' && <TrendingUp className="h-2.5 w-2.5" />}
                  {indicator.direction === 'declining' && <TrendingDown className="h-2.5 w-2.5" />}
                  {indicator.direction === 'stable' && <Minus className="h-2.5 w-2.5" />}
                  {indicator.area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {memory.scripture_refs.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-[hsl(var(--scripture))]/30">
            <p className="text-xs flex items-center gap-1.5">
              <BookMarked className="h-3 w-3 text-accent" />
              <span className="font-medium">
                {memory.scripture_refs[0].book} {memory.scripture_refs[0].chapter}:{memory.scripture_refs[0].verse_start}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemoryTimeline({ memories }: { memories: CoachMemory[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {memories.map(memory => (
          <div key={memory.id} className="relative pl-10">
            <div className={cn(
              'absolute left-2 top-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center',
              memory.memory_type.includes('victory') ? 'bg-success' :
              memory.memory_type.includes('struggle') ? 'bg-warning' : 'bg-primary'
            )}>
              {getMemoryTypeIcon(memory.memory_type, 'h-3 w-3 text-white')}
            </div>
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {memory.memory_type.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(memory.last_seen_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <h4 className="font-medium mb-1">{memory.title}</h4>
                <p className="text-sm text-muted-foreground">{memory.summary}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMemoryTypeIcon(type: MemoryType, className = 'h-4 w-4'): React.ReactNode {
  const icons: Record<MemoryType, React.ReactNode> = {
    recurring_struggle: <AlertCircle className={cn(className, 'text-warning')} />,
    recurring_victory: <CheckCircle2 className={cn(className, 'text-success')} />,
    pattern_behavior: <Target className={cn(className, 'text-primary')} />,
    pattern_emotional: <Heart className={cn(className, 'text-[hsl(var(--spiritual))]')} />,
    pattern_spiritual: <Sparkles className={cn(className, 'text-accent')} />,
    relationship_insight: <Users className={cn(className, 'text-primary')} />,
    leadership_insight: <Briefcase className={cn(className, 'text-primary')} />,
    business_insight: <Briefcase className={cn(className, 'text-primary')} />,
    health_insight: <Activity className={cn(className, 'text-success')} />,
    financial_insight: <Wallet className={cn(className, 'text-warning')} />,
    prayer_burden: <Heart className={cn(className, 'text-[hsl(var(--spiritual))]')} />,
    calling_clarity: <Lightbulb className={cn(className, 'text-accent')} />,
    growth_milestone: <TrendingUp className={cn(className, 'text-success')} />,
  };
  return icons[type] || <Brain className={className} />;
}
