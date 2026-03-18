'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookMarked,
  Search,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Share2,
  Copy,
  Heart,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  List,
  Grid3X3,
  Sparkles,
  X,
  Clock,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { bibleBooks, sampleBibleChapter, topicalScriptures } from '@/data/mock-data';
import type { BibleBook, BibleVerse, ScriptureReference } from '@/types/coach';
import { cn } from '@/lib/utils';
import { getScriptureParamsFromUrl, type ScriptureNavigation } from '@/lib/bible/navigation';
import { RelatedVersesStudy } from '@/components/bible/RelatedVersesStudy';

export function ScriptureTab() {
  const searchParams = useSearchParams();

  // Get navigation params from URL
  const navParams = React.useMemo(() => {
    return getScriptureParamsFromUrl(searchParams);
  }, [searchParams]);

  // Check if we should show the study view
  const studyRef = searchParams.get('study');

  const [selectedBook, setSelectedBook] = React.useState('Proverbs');
  const [selectedChapter, setSelectedChapter] = React.useState(3);
  const [highlightedVerse, setHighlightedVerse] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<'read' | 'topics' | 'saved' | 'history'>('read');
  const [showBookSelector, setShowBookSelector] = React.useState(false);
  const [selectedVerse, setSelectedVerse] = React.useState<BibleVerse | null>(null);
  const [savedVerses, setSavedVerses] = React.useState<Set<string>>(new Set(['Proverbs-3-5']));
  const [searchQuery, setSearchQuery] = React.useState('');
  const [studyReference, setStudyReference] = React.useState<string | null>(null);

  // Handle URL navigation parameters
  React.useEffect(() => {
    if (navParams) {
      // Update book and chapter from URL
      const book = bibleBooks.find(b =>
        b.name.toLowerCase() === navParams.book.toLowerCase()
      );
      if (book) {
        setSelectedBook(book.name);
        setSelectedChapter(navParams.chapter);
        setHighlightedVerse(navParams.verse || null);
        setActiveTab('read');

        // Scroll to highlighted verse after a short delay
        if (navParams.verse) {
          setTimeout(() => {
            const verseElement = document.getElementById(`verse-${navParams.verse}`);
            if (verseElement) {
              verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      }
    }
  }, [navParams]);

  // Handle study view URL parameter
  React.useEffect(() => {
    if (studyRef) {
      setStudyReference(decodeURIComponent(studyRef));
    } else {
      setStudyReference(null);
    }
  }, [studyRef]);

  // Clear highlight after a few seconds
  React.useEffect(() => {
    if (highlightedVerse) {
      const timer = setTimeout(() => {
        setHighlightedVerse(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedVerse]);

  const currentBook = bibleBooks.find(b => b.name === selectedBook);
  const chapters = currentBook ? Array.from({ length: currentBook.chapters }, (_, i) => i + 1) : [];

  const toggleSaveVerse = (verse: BibleVerse) => {
    const key = `${verse.book}-${verse.chapter}-${verse.verse}`;
    const newSaved = new Set(savedVerses);
    if (newSaved.has(key)) {
      newSaved.delete(key);
    } else {
      newSaved.add(key);
    }
    setSavedVerses(newSaved);
  };

  const isVerseSaved = (verse: BibleVerse) => {
    return savedVerses.has(`${verse.book}-${verse.chapter}-${verse.verse}`);
  };

  const router = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;
  }, []);

  const handleCloseStudy = () => {
    setStudyReference(null);
    // Update URL to remove study param
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('study');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleStudyVerseClick = (ref: string) => {
    // Navigate to that verse in the study view
    setStudyReference(ref);
    // Update URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('study', encodeURIComponent(ref));
      window.history.pushState({}, '', url.toString());
    }
  };

  // Show study view if active
  if (studyReference) {
    return (
      <div className="pb-24 md:pb-8">
        {/* Header */}
        <div className="relative border-b">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] via-transparent to-[hsl(var(--scripture))]/[0.03]" />
          <div className="container max-w-6xl mx-auto px-4 py-8 relative">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BookMarked className="h-5 w-5 text-accent" />
                </div>
                Scripture
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Exploring related verses and deeper connections.
              </p>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-6">
          <RelatedVersesStudy
            reference={studyReference}
            onBack={handleCloseStudy}
            onVerseClick={handleStudyVerseClick}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] via-transparent to-[hsl(var(--scripture))]/[0.03]" />
        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BookMarked className="h-5 w-5 text-accent" />
                </div>
                Scripture
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Read, study, and meditate on God's Word.
              </p>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="read">Read</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'read' && (
          <div className="space-y-6">
            {/* Book/Chapter Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="outline"
                  onClick={() => setShowBookSelector(true)}
                  className="gap-2 min-w-[180px] justify-between"
                >
                  <span className="font-medium">{selectedBook}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Select
                  value={selectedChapter.toString()}
                  onValueChange={(v) => setSelectedChapter(parseInt(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(ch => (
                      <SelectItem key={ch} value={ch.toString()}>
                        Chapter {ch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={selectedChapter <= 1}
                  onClick={() => setSelectedChapter(c => Math.max(1, c - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={selectedChapter >= (currentBook?.chapters || 1)}
                  onClick={() => setSelectedChapter(c => Math.min(currentBook?.chapters || c, c + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chapter Content */}
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {sampleBibleChapter.book} {sampleBibleChapter.chapter}
                    </CardTitle>
                    <CardDescription>King James Version</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="space-y-4 pr-4">
                    {sampleBibleChapter.verses.map((verse) => (
                      <div
                        key={verse.verse}
                        id={`verse-${verse.verse}`}
                        className={cn(
                          'group relative p-3 -mx-3 rounded-lg transition-all cursor-pointer',
                          selectedVerse?.verse === verse.verse && 'bg-[hsl(var(--scripture))]/50',
                          isVerseSaved(verse) && 'border-l-2 border-accent',
                          highlightedVerse === verse.verse && 'bg-accent/20 ring-2 ring-accent/50 shadow-md animate-pulse'
                        )}
                        onClick={() => setSelectedVerse(verse)}
                      >
                        <span className={cn(
                          'text-xs font-semibold mr-2 transition-colors',
                          highlightedVerse === verse.verse ? 'text-accent' : 'text-muted-foreground'
                        )}>
                          {verse.verse}
                        </span>
                        <span className="text-base leading-relaxed">
                          {verse.text}
                        </span>

                        {/* Verse Actions (visible on hover) */}
                        <div className={cn(
                          'absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
                          selectedVerse?.verse === verse.verse && 'opacity-100'
                        )}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveVerse(verse);
                            }}
                          >
                            {isVerseSaved(verse) ? (
                              <BookmarkCheck className="h-4 w-4 text-accent" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}`);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Verse Detail Panel */}
            {selectedVerse && (
              <Card className="card-premium border-l-4 border-l-accent">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                      </Badge>
                      <blockquote className="text-lg italic border-l-2 border-accent/50 pl-4 my-3">
                        "{selectedVerse.text}"
                      </blockquote>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          Get Coaching
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Add Reflection
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Heart className="h-4 w-4" />
                          Pray This
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedVerse(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics or themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {topicalScriptures.map((topic) => (
                <Card key={topic.topic} className="card-premium hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{topic.topic}</CardTitle>
                    <CardDescription className="text-sm">
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topic.verses.slice(0, 2).map((verse, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[hsl(var(--scripture))]/30">
                          <p className="text-xs text-muted-foreground mb-1">
                            {verse.book} {verse.chapter}:{verse.verse_start}
                            {verse.verse_end && `-${verse.verse_end}`}
                          </p>
                          <p className="text-sm line-clamp-2 italic">
                            "{verse.text.slice(0, 100)}..."
                          </p>
                        </div>
                      ))}
                    </div>
                    <Button variant="link" size="sm" className="px-0 mt-2">
                      View all {topic.verses.length} verses
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {savedVerses.size} saved verses
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            <div className="space-y-3">
              {Array.from(savedVerses).map((key) => {
                const [book, chapter, verse] = key.split('-');
                const verseData = sampleBibleChapter.verses.find(
                  v => v.book === book && v.chapter === parseInt(chapter) && v.verse === parseInt(verse)
                );
                if (!verseData) return null;

                return (
                  <Card key={key} className="card-premium">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {book} {chapter}:{verse}
                          </Badge>
                          <p className="text-sm italic">"{verseData.text}"</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSaveVerse(verseData)}
                        >
                          <BookmarkCheck className="h-4 w-4 text-accent" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {savedVerses.size === 0 && (
                <Card className="card-premium">
                  <CardContent className="py-12 text-center">
                    <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      No saved verses yet. Bookmark verses while reading to save them here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Reading History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { book: 'Proverbs', chapter: 3, date: 'Today' },
                    { book: 'Philippians', chapter: 4, date: 'Yesterday' },
                    { book: 'Psalm', chapter: 23, date: 'Mar 16' },
                    { book: 'James', chapter: 1, date: 'Mar 15' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BookMarked className="h-4 w-4 text-accent" />
                        <span className="font-medium">
                          {item.book} {item.chapter}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Book Selector Dialog */}
      <CommandDialog open={showBookSelector} onOpenChange={setShowBookSelector}>
        <CommandInput placeholder="Search books..." />
        <CommandList>
          <CommandEmpty>No book found.</CommandEmpty>
          <CommandGroup heading="Old Testament">
            {bibleBooks.filter(b => b.testament === 'old').map((book) => (
              <CommandItem
                key={book.id}
                onSelect={() => {
                  setSelectedBook(book.name);
                  setSelectedChapter(1);
                  setShowBookSelector(false);
                }}
              >
                <BookMarked className="h-4 w-4 mr-2" />
                {book.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {book.chapters} ch.
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="New Testament">
            {bibleBooks.filter(b => b.testament === 'new').map((book) => (
              <CommandItem
                key={book.id}
                onSelect={() => {
                  setSelectedBook(book.name);
                  setSelectedChapter(1);
                  setShowBookSelector(false);
                }}
              >
                <BookMarked className="h-4 w-4 mr-2" />
                {book.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {book.chapters} ch.
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
