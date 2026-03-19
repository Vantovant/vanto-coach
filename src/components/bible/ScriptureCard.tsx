'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, Loader2, AlertCircle, ExternalLink, Copy, Check, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBibleVerse, useBibleVerses } from '@/hooks/useBibleVerse';
import { useCrossReferences } from '@/hooks/useCrossReferences';
import { buildScriptureUrlFromReference } from '@/lib/bible/navigation';
import { RelatedVersesDialogContent } from '@/components/bible/RelatedVersesView';
import type { BiblePassage } from '@/lib/bible/api';
import type { CrossReference } from '@/lib/bible/cross-references';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ScriptureCardProps {
  reference: string;
  translation?: string;
  showTranslation?: boolean;
  showCrossReferences?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Display a single scripture passage with automatic lookup
 */
export function ScriptureCard({
  reference,
  translation = 'kjv',
  showTranslation = true,
  showCrossReferences = false,
  compact = false,
  className,
}: ScriptureCardProps) {
  const { passage, isLoading, error } = useBibleVerse(reference, translation);
  const crossRefs = useCrossReferences(reference);
  const [copied, setCopied] = React.useState(false);
  const [showRelated, setShowRelated] = React.useState(false);

  const handleCopy = async () => {
    if (!passage) return;
    const text = `${passage.reference} - "${passage.text}" (${passage.translation})`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className={cn('border-l-2 border-l-accent/50', className)}>
        <CardContent className={cn('flex items-center gap-3', compact ? 'p-3' : 'p-4')}>
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Loading {reference}...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !passage) {
    return (
      <Card className={cn('border-l-2 border-l-muted', className)}>
        <CardContent className={cn('flex items-center gap-3', compact ? 'p-3' : 'p-4')}>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{reference}</span>
            <p className="text-xs text-muted-foreground">{error || 'Could not load verse'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-l-2 border-l-accent bg-gradient-to-r from-[hsl(var(--scripture))]/30 via-transparent to-transparent',
      'hover:shadow-sm transition-shadow',
      className
    )}>
      <CardContent className={cn(compact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-semibold text-foreground">{passage.reference}</span>
            {showTranslation && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {passage.translation}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <blockquote className={cn(
          'font-serif italic leading-relaxed text-foreground/90',
          compact ? 'text-sm' : 'text-base'
        )}>
          "{passage.text}"
        </blockquote>

        {/* Cross-References Section */}
        {showCrossReferences && crossRefs.hasReferences && (
          <Collapsible open={showRelated} onOpenChange={setShowRelated} className="mt-3">
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
              <CrossReferencesList
                references={crossRefs.relatedVerses}
                themes={crossRefs.themes}
                scriptureRef={reference}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Display a list of cross-references with View All option
 */
function CrossReferencesList({
  references,
  themes,
  scriptureRef,
}: {
  references: CrossReference[];
  themes: string[];
  scriptureRef: string;
}) {
  const [showAllDialog, setShowAllDialog] = React.useState(false);

  return (
    <div className="space-y-2">
      {/* Themes */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {themes.map((theme, idx) => (
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
        {references.slice(0, 4).map((ref, idx) => (
          <CrossReferenceItem key={idx} reference={ref} />
        ))}
      </div>

      {/* View All Button */}
      {references.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setShowAllDialog(true)}
        >
          View All {references.length} Related Verses
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}

      {/* View All Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent" />
              Related Verses
            </DialogTitle>
            <DialogDescription>
              Cross-references for {scriptureRef}
            </DialogDescription>
          </DialogHeader>
          <RelatedVersesDialogContent
            reference={scriptureRef}
            onNavigate={() => setShowAllDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Single cross-reference item with hover preview and navigation
 */
function CrossReferenceItem({ reference }: { reference: CrossReference }) {
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

interface ScriptureListProps {
  references: string[];
  translation?: string;
  showTranslation?: boolean;
  compact?: boolean;
  maxDisplay?: number;
  className?: string;
}

/**
 * Display multiple scripture passages with automatic lookup
 */
export function ScriptureList({
  references,
  translation = 'kjv',
  showTranslation = true,
  compact = false,
  maxDisplay = 5,
  className,
}: ScriptureListProps) {
  const { passages, isLoading, errors } = useBibleVerses(
    references.slice(0, maxDisplay),
    translation
  );
  const [expandedRefs, setExpandedRefs] = React.useState<Set<string>>(new Set());

  if (!references || references.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {references.slice(0, maxDisplay).map((ref, idx) => (
          <Card key={idx} className="border-l-2 border-l-accent/30">
            <CardContent className="p-3 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">Loading {ref}...</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const displayRefs = references.slice(0, maxDisplay);
  const remainingCount = references.length - maxDisplay;

  return (
    <div className={cn('space-y-2', className)}>
      {displayRefs.map((ref) => {
        const passage = passages.get(ref);
        const error = errors.get(ref);
        const isExpanded = expandedRefs.has(ref);

        if (error || !passage) {
          return (
            <Card key={ref} className="border-l-2 border-l-muted">
              <CardContent className="p-3 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{ref}</span>
                  <p className="text-xs text-muted-foreground">{error || 'Could not load'}</p>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <ScriptureCardDisplay
            key={ref}
            passage={passage}
            showTranslation={showTranslation}
            compact={compact}
            isExpanded={isExpanded}
            onToggleExpand={() => {
              setExpandedRefs(prev => {
                const next = new Set(prev);
                if (next.has(ref)) {
                  next.delete(ref);
                } else {
                  next.add(ref);
                }
                return next;
              });
            }}
          />
        );
      })}

      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          +{remainingCount} more scripture{remainingCount > 1 ? 's' : ''} referenced
        </p>
      )}
    </div>
  );
}

interface ScriptureCardDisplayProps {
  passage: BiblePassage;
  showTranslation?: boolean;
  compact?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function ScriptureCardDisplay({
  passage,
  showTranslation = true,
  compact = false,
  isExpanded = true,
  onToggleExpand,
}: ScriptureCardDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const text = `${passage.reference} - "${passage.text}" (${passage.translation})`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Truncate long passages for compact view
  const displayText = compact && passage.text.length > 200 && !isExpanded
    ? passage.text.slice(0, 200) + '...'
    : passage.text;

  return (
    <Card className={cn(
      'border-l-2 border-l-accent bg-gradient-to-r from-[hsl(var(--scripture))]/30 via-transparent to-transparent',
      'hover:shadow-sm transition-shadow'
    )}>
      <CardContent className={cn(compact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-semibold text-foreground">{passage.reference}</span>
            {showTranslation && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {passage.translation}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <blockquote className={cn(
          'font-serif italic leading-relaxed text-foreground/90',
          compact ? 'text-sm' : 'text-base'
        )}>
          "{displayText}"
        </blockquote>
        {compact && passage.text.length > 200 && (
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto mt-1 text-xs"
            onClick={onToggleExpand}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Inline scripture reference that shows verse on hover/click
 */
interface ScriptureInlineProps {
  reference: string;
  translation?: string;
  children?: React.ReactNode;
}

export function ScriptureInline({
  reference,
  translation = 'kjv',
  children,
}: ScriptureInlineProps) {
  const [showVerse, setShowVerse] = React.useState(false);
  const { passage, isLoading } = useBibleVerse(showVerse ? reference : null, translation);

  return (
    <span className="relative inline-block">
      <button
        className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent cursor-pointer"
        onClick={() => setShowVerse(!showVerse)}
      >
        {children || reference}
      </button>
      {showVerse && (
        <div className="absolute z-50 mt-1 left-0 w-72 animate-fade-in">
          {isLoading ? (
            <Card className="border shadow-lg">
              <CardContent className="p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </CardContent>
            </Card>
          ) : passage ? (
            <Card className="border shadow-lg bg-card">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-accent mb-1">{passage.reference}</p>
                <p className="text-sm font-serif italic">"{passage.text}"</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-lg">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Could not load verse</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </span>
  );
}
