'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  ArrowLeft,
  Loader2,
  Link2,
  ChevronRight,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Share2,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBibleVerse, useBibleVerses } from '@/hooks/useBibleVerse';
import { useCrossReferences } from '@/hooks/useCrossReferences';
import { buildScriptureUrlFromReference } from '@/lib/bible/navigation';
import type { CrossReference } from '@/lib/bible/cross-references';
import { cn } from '@/lib/utils';

interface RelatedVersesStudyProps {
  reference: string;
  onBack?: () => void;
  onVerseClick?: (reference: string) => void;
}

/**
 * Comprehensive Related Verses Study View
 * Shows the main verse with all related cross-references grouped by relevance and theme
 */
export function RelatedVersesStudy({
  reference,
  onBack,
  onVerseClick,
}: RelatedVersesStudyProps) {
  const router = useRouter();
  const { passage, isLoading, error } = useBibleVerse(reference);
  const crossRefs = useCrossReferences(reference);
  const [viewMode, setViewMode] = React.useState<'grouped' | 'list'>('grouped');
  const [copiedVerse, setCopiedVerse] = React.useState<string | null>(null);
  const [savedVerses, setSavedVerses] = React.useState<Set<string>>(new Set());

  // Get all related verse references for batch loading
  const relatedRefs = crossRefs.relatedVerses.map(r => r.reference);
  const { passages: relatedPassages, isLoading: loadingRelated } = useBibleVerses(relatedRefs);

  const handleCopy = async (ref: string, text: string) => {
    await navigator.clipboard.writeText(`${ref} - "${text}"`);
    setCopiedVerse(ref);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const toggleSave = (ref: string) => {
    setSavedVerses(prev => {
      const next = new Set(prev);
      if (next.has(ref)) {
        next.delete(ref);
      } else {
        next.add(ref);
      }
      return next;
    });
  };

  const handleVerseClick = (ref: string) => {
    if (onVerseClick) {
      onVerseClick(ref);
    } else {
      const url = buildScriptureUrlFromReference(ref);
      if (url) router.push(url);
    }
  };

  // Group verses by relevance
  const groupedByRelevance = React.useMemo(() => {
    return {
      direct: crossRefs.directReferences,
      thematic: crossRefs.thematicReferences,
      complementary: crossRefs.complementaryReferences,
    };
  }, [crossRefs]);

  // Group verses by theme
  const groupedByTheme = React.useMemo(() => {
    const groups: Record<string, CrossReference[]> = {};
    for (const ref of crossRefs.relatedVerses) {
      if (!groups[ref.theme]) {
        groups[ref.theme] = [];
      }
      groups[ref.theme].push(ref);
    }
    return groups;
  }, [crossRefs.relatedVerses]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
        <p className="text-sm text-muted-foreground">Loading {reference}...</p>
      </div>
    );
  }

  if (error || !passage) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <BookMarked className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm font-medium mb-1">Could not load verse</p>
        <p className="text-xs text-muted-foreground">{error || 'Verse not found'}</p>
        {onBack && (
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent" />
              Related Verses Study
            </h2>
            <p className="text-sm text-muted-foreground">
              Exploring connections from {passage.reference}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grouped')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Primary Verse Card */}
      <Card className="border-l-4 border-l-accent bg-gradient-to-r from-[hsl(var(--scripture))]/40 via-transparent to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-accent" />
              <CardTitle className="text-base">{passage.reference}</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {passage.translation}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopy(passage.reference, passage.text)}
              >
                {copiedVerse === passage.reference ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleSave(passage.reference)}
              >
                {savedVerses.has(passage.reference) ? (
                  <BookmarkCheck className="h-4 w-4 text-accent" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <blockquote className="font-serif text-lg italic leading-relaxed text-foreground/90">
            "{passage.text}"
          </blockquote>

          {/* Themes */}
          {crossRefs.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground mr-2">Themes:</span>
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
        </CardContent>
      </Card>

      {/* Related Verses Section */}
      {!crossRefs.hasReferences ? (
        <EmptyState reference={passage.reference} />
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {crossRefs.directReferences.length} Direct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {crossRefs.thematicReferences.length} Thematic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                {crossRefs.complementaryReferences.length} Complementary
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {crossRefs.relatedVerses.length} related verses
            </span>
          </div>

          {viewMode === 'grouped' ? (
            <GroupedView
              groupedByRelevance={groupedByRelevance}
              relatedPassages={relatedPassages}
              loadingRelated={loadingRelated}
              copiedVerse={copiedVerse}
              savedVerses={savedVerses}
              onCopy={handleCopy}
              onSave={toggleSave}
              onVerseClick={handleVerseClick}
            />
          ) : (
            <ListView
              verses={crossRefs.relatedVerses}
              relatedPassages={relatedPassages}
              loadingRelated={loadingRelated}
              copiedVerse={copiedVerse}
              savedVerses={savedVerses}
              onCopy={handleCopy}
              onSave={toggleSave}
              onVerseClick={handleVerseClick}
            />
          )}
        </div>
      )}

      {/* Future Features Placeholder */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Coming Soon</p>
              <p className="text-xs">Personal notes, study plans, and verse memorization tools</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Grouped View Component
interface GroupedViewProps {
  groupedByRelevance: {
    direct: CrossReference[];
    thematic: CrossReference[];
    complementary: CrossReference[];
  };
  relatedPassages: Map<string, any>;
  loadingRelated: boolean;
  copiedVerse: string | null;
  savedVerses: Set<string>;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string) => void;
  onVerseClick: (ref: string) => void;
}

function GroupedView({
  groupedByRelevance,
  relatedPassages,
  loadingRelated,
  copiedVerse,
  savedVerses,
  onCopy,
  onSave,
  onVerseClick,
}: GroupedViewProps) {
  return (
    <div className="space-y-6">
      {/* Direct References */}
      {groupedByRelevance.direct.length > 0 && (
        <RelevanceGroup
          title="Direct References"
          description="Verses directly connected to this passage"
          color="accent"
          verses={groupedByRelevance.direct}
          relatedPassages={relatedPassages}
          loadingRelated={loadingRelated}
          copiedVerse={copiedVerse}
          savedVerses={savedVerses}
          onCopy={onCopy}
          onSave={onSave}
          onVerseClick={onVerseClick}
        />
      )}

      {/* Thematic References */}
      {groupedByRelevance.thematic.length > 0 && (
        <RelevanceGroup
          title="Thematic Connections"
          description="Verses sharing similar themes and concepts"
          color="primary"
          verses={groupedByRelevance.thematic}
          relatedPassages={relatedPassages}
          loadingRelated={loadingRelated}
          copiedVerse={copiedVerse}
          savedVerses={savedVerses}
          onCopy={onCopy}
          onSave={onSave}
          onVerseClick={onVerseClick}
        />
      )}

      {/* Complementary References */}
      {groupedByRelevance.complementary.length > 0 && (
        <RelevanceGroup
          title="Complementary Passages"
          description="Verses that add context and depth"
          color="muted"
          verses={groupedByRelevance.complementary}
          relatedPassages={relatedPassages}
          loadingRelated={loadingRelated}
          copiedVerse={copiedVerse}
          savedVerses={savedVerses}
          onCopy={onCopy}
          onSave={onSave}
          onVerseClick={onVerseClick}
        />
      )}
    </div>
  );
}

// Relevance Group Component
interface RelevanceGroupProps {
  title: string;
  description: string;
  color: 'accent' | 'primary' | 'muted';
  verses: CrossReference[];
  relatedPassages: Map<string, any>;
  loadingRelated: boolean;
  copiedVerse: string | null;
  savedVerses: Set<string>;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string) => void;
  onVerseClick: (ref: string) => void;
}

function RelevanceGroup({
  title,
  description,
  color,
  verses,
  relatedPassages,
  loadingRelated,
  copiedVerse,
  savedVerses,
  onCopy,
  onSave,
  onVerseClick,
}: RelevanceGroupProps) {
  const colorClasses = {
    accent: 'border-l-accent bg-accent/5',
    primary: 'border-l-primary bg-primary/5',
    muted: 'border-l-muted-foreground bg-muted/30',
  };

  const dotClasses = {
    accent: 'bg-accent',
    primary: 'bg-primary',
    muted: 'bg-muted-foreground',
  };

  return (
    <Card className={cn('border-l-4', colorClasses[color])}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', dotClasses[color])} />
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {verses.length} verse{verses.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {verses.map((verse, idx) => (
          <RelatedVerseCard
            key={idx}
            crossRef={verse}
            passage={relatedPassages.get(verse.reference)}
            isLoading={loadingRelated}
            isCopied={copiedVerse === verse.reference}
            isSaved={savedVerses.has(verse.reference)}
            onCopy={onCopy}
            onSave={onSave}
            onClick={onVerseClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// List View Component
interface ListViewProps {
  verses: CrossReference[];
  relatedPassages: Map<string, any>;
  loadingRelated: boolean;
  copiedVerse: string | null;
  savedVerses: Set<string>;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string) => void;
  onVerseClick: (ref: string) => void;
}

function ListView({
  verses,
  relatedPassages,
  loadingRelated,
  copiedVerse,
  savedVerses,
  onCopy,
  onSave,
  onVerseClick,
}: ListViewProps) {
  return (
    <div className="space-y-3">
      {verses.map((verse, idx) => (
        <RelatedVerseCard
          key={idx}
          crossRef={verse}
          passage={relatedPassages.get(verse.reference)}
          isLoading={loadingRelated}
          isCopied={copiedVerse === verse.reference}
          isSaved={savedVerses.has(verse.reference)}
          onCopy={onCopy}
          onSave={onSave}
          onClick={onVerseClick}
          showRelevance
        />
      ))}
    </div>
  );
}

// Related Verse Card Component
interface RelatedVerseCardProps {
  crossRef: CrossReference;
  passage: any;
  isLoading: boolean;
  isCopied: boolean;
  isSaved: boolean;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string) => void;
  onClick: (ref: string) => void;
  showRelevance?: boolean;
}

function RelatedVerseCard({
  crossRef,
  passage,
  isLoading,
  isCopied,
  isSaved,
  onCopy,
  onSave,
  onClick,
  showRelevance = false,
}: RelatedVerseCardProps) {
  const relevanceColors = {
    direct: 'bg-accent',
    thematic: 'bg-primary',
    complementary: 'bg-muted-foreground',
  };

  return (
    <div
      className={cn(
        'group p-4 rounded-lg transition-all cursor-pointer',
        'bg-card hover:bg-muted/50 border hover:border-accent/30',
        'hover:shadow-sm active:scale-[0.995]'
      )}
      onClick={() => onClick(crossRef.reference)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {showRelevance && (
            <span className={cn('h-2 w-2 rounded-full shrink-0', relevanceColors[crossRef.relevance])} />
          )}
          <span className="text-sm font-medium group-hover:text-accent transition-colors">
            {crossRef.reference}
          </span>
          <Badge variant="secondary" className="text-[9px] capitalize font-normal">
            {crossRef.theme}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              if (passage) onCopy(crossRef.reference, passage.text);
            }}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onSave(crossRef.reference);
            }}
          >
            {isSaved ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-accent" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading verse...</span>
        </div>
      ) : passage ? (
        <p className="text-sm font-serif italic leading-relaxed text-muted-foreground line-clamp-2">
          "{passage.text}"
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">Verse text unavailable</p>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ reference }: { reference: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Link2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-medium mb-1">No Related Verses Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          Cross-references for {reference} haven't been added yet.
          Check back as we continue to expand our scripture connections.
        </p>
        <Badge variant="secondary" className="text-xs">
          More coming soon
        </Badge>
      </CardContent>
    </Card>
  );
}

export default RelatedVersesStudy;
