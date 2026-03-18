'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  Link2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
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

interface RelatedVersesViewProps {
  reference: string;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Comprehensive view of all related verses for a given scripture reference
 * Used for deeper scripture study and exploration
 */
export function RelatedVersesView({ reference, onBack, onClose }: RelatedVersesViewProps) {
  const router = useRouter();
  const { passage: mainPassage, isLoading: mainLoading } = useBibleVerse(reference);
  const crossRefs = useCrossReferences(reference);
  const [activeTab, setActiveTab] = React.useState<'all' | 'direct' | 'thematic' | 'complementary'>('all');
  const [savedVerses, setSavedVerses] = React.useState<Set<string>>(new Set());

  // Get all related verse references for batch loading
  const relatedRefs = React.useMemo(() => {
    return crossRefs.relatedVerses.map(r => r.reference);
  }, [crossRefs.relatedVerses]);

  const { passages: relatedPassages, isLoading: relatedLoading } = useBibleVerses(relatedRefs);

  // Filter verses by tab
  const filteredVerses = React.useMemo(() => {
    if (activeTab === 'all') return crossRefs.relatedVerses;
    return crossRefs.relatedVerses.filter(v => v.relevance === activeTab);
  }, [crossRefs.relatedVerses, activeTab]);

  const handleNavigateToVerse = (ref: string) => {
    const url = buildScriptureUrlFromReference(ref);
    if (url) {
      router.push(url);
    }
  };

  const toggleSaveVerse = (ref: string) => {
    const newSaved = new Set(savedVerses);
    if (newSaved.has(ref)) {
      newSaved.delete(ref);
    } else {
      newSaved.add(ref);
    }
    setSavedVerses(newSaved);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-accent" />
                  <h1 className="text-lg font-semibold">Related Verses</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cross-references for {reference}
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Primary Verse Card */}
        <Card className="card-elevated overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--scripture))]/40 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <BookMarked className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">Primary Verse</CardTitle>
                  <CardDescription>{reference}</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleNavigateToVerse(reference)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Scripture
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            {mainLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">Loading verse...</span>
              </div>
            ) : mainPassage ? (
              <blockquote className="font-serif text-lg italic leading-relaxed border-l-2 border-accent/60 pl-4">
                "{mainPassage.text}"
              </blockquote>
            ) : (
              <p className="text-muted-foreground">Could not load verse</p>
            )}
          </CardContent>
        </Card>

        {/* Themes Section */}
        {crossRefs.themes.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Themes in This Passage
            </h2>
            <div className="flex flex-wrap gap-2">
              {crossRefs.themes.map((theme, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-sm capitalize bg-accent/10 text-accent border-accent/20"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Related Verses Section */}
        {crossRefs.hasReferences ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold">
                {crossRefs.relatedVerses.length} Related Verses
              </h2>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">
                    All ({crossRefs.relatedVerses.length})
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="text-xs px-3 h-7">
                    Direct ({crossRefs.directReferences.length})
                  </TabsTrigger>
                  <TabsTrigger value="thematic" className="text-xs px-3 h-7">
                    Thematic ({crossRefs.thematicReferences.length})
                  </TabsTrigger>
                  <TabsTrigger value="complementary" className="text-xs px-3 h-7">
                    Complementary ({crossRefs.complementaryReferences.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Relevance Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span>Direct - Same context or parallel passage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Thematic - Shares similar themes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span>Complementary - Adds additional perspective</span>
              </div>
            </div>

            <Separator />

            {/* Verses List */}
            {relatedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVerses.map((crossRef, idx) => {
                  const passage = relatedPassages.get(crossRef.reference);
                  return (
                    <RelatedVerseCard
                      key={idx}
                      crossRef={crossRef}
                      passage={passage}
                      isSaved={savedVerses.has(crossRef.reference)}
                      onNavigate={() => handleNavigateToVerse(crossRef.reference)}
                      onToggleSave={() => toggleSaveVerse(crossRef.reference)}
                    />
                  );
                })}
              </div>
            )}

            {filteredVerses.length === 0 && !relatedLoading && (
              <div className="text-center py-12">
                <Link2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  No {activeTab} references found for this verse
                </p>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-2">No Cross-References Available</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Cross-references for this verse haven't been added yet.
                Check back later as we continue to expand our scripture database.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Study Tips */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Scripture Study Tip</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cross-references help you see how themes connect throughout the Bible.
                  Direct references often come from the same author or context.
                  Thematic references share similar messages.
                  Complementary references provide additional perspective or application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Individual related verse card with full text and actions
 */
interface RelatedVerseCardProps {
  crossRef: CrossReference;
  passage: { reference: string; text: string; translation: string } | null | undefined;
  isSaved: boolean;
  onNavigate: () => void;
  onToggleSave: () => void;
}

function RelatedVerseCard({
  crossRef,
  passage,
  isSaved,
  onNavigate,
  onToggleSave
}: RelatedVerseCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!passage) return;
    const text = `${passage.reference} - "${passage.text}" (${passage.translation})`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      'border-l-2',
      crossRef.relevance === 'direct' && 'border-l-accent',
      crossRef.relevance === 'thematic' && 'border-l-primary',
      crossRef.relevance === 'complementary' && 'border-l-muted-foreground'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <BookMarked className={cn(
              'h-4 w-4',
              crossRef.relevance === 'direct' && 'text-accent',
              crossRef.relevance === 'thematic' && 'text-primary',
              crossRef.relevance === 'complementary' && 'text-muted-foreground'
            )} />
            <div>
              <h3 className="font-semibold text-sm">{crossRef.reference}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] capitalize',
                    crossRef.relevance === 'direct' && 'border-accent/50 text-accent',
                    crossRef.relevance === 'thematic' && 'border-primary/50 text-primary',
                    crossRef.relevance === 'complementary' && 'border-muted-foreground/50'
                  )}
                >
                  {crossRef.relevance}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  {crossRef.theme}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleSave}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-accent" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              disabled={!passage}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {passage ? (
          <blockquote className="font-serif italic text-sm leading-relaxed text-foreground/90 mb-4">
            "{passage.text}"
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-4">
            Loading verse text...
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">
            {passage?.translation || 'KJV'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={onNavigate}
          >
            Read in context
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact modal/dialog version for embedding in other views
 */
interface RelatedVersesDialogContentProps {
  reference: string;
  onNavigate?: (ref: string) => void;
}

export function RelatedVersesDialogContent({ reference, onNavigate }: RelatedVersesDialogContentProps) {
  const router = useRouter();
  const crossRefs = useCrossReferences(reference);
  const relatedRefs = crossRefs.relatedVerses.map(r => r.reference);
  const { passages, isLoading } = useBibleVerses(relatedRefs);

  const handleNavigate = (ref: string) => {
    if (onNavigate) {
      onNavigate(ref);
    } else {
      const url = buildScriptureUrlFromReference(ref);
      if (url) router.push(url);
    }
  };

  if (!crossRefs.hasReferences) {
    return (
      <div className="text-center py-8">
        <Link2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          No cross-references available for this verse
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-3 pr-4">
        {/* Themes */}
        {crossRefs.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {crossRefs.themes.map((theme, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] capitalize bg-accent/10 text-accent"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {/* Verses */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          crossRefs.relatedVerses.map((crossRef, idx) => {
            const passage = passages.get(crossRef.reference);
            return (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all',
                  'border-l-2 bg-muted/30 hover:bg-muted/50',
                  crossRef.relevance === 'direct' && 'border-l-accent',
                  crossRef.relevance === 'thematic' && 'border-l-primary',
                  crossRef.relevance === 'complementary' && 'border-l-muted-foreground'
                )}
                onClick={() => handleNavigate(crossRef.reference)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{crossRef.reference}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] capitalize',
                      crossRef.relevance === 'direct' && 'border-accent/50 text-accent',
                      crossRef.relevance === 'thematic' && 'border-primary/50 text-primary',
                      crossRef.relevance === 'complementary' && 'border-muted-foreground/50'
                    )}
                  >
                    {crossRef.relevance}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground capitalize mb-2">
                  {crossRef.theme}
                </p>
                {passage && (
                  <p className="text-xs font-serif italic leading-relaxed line-clamp-2">
                    "{passage.text}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
