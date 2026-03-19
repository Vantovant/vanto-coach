// Scripture Navigation Utility
// Shared utilities for navigating to specific Bible passages
// Used by cross-references, reading plans, and search features

import { parseScriptureReference } from './api';

export interface ScriptureNavigation {
  book: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

/**
 * Parse a scripture reference string into navigation parameters
 */
export function parseNavigationReference(reference: string): ScriptureNavigation | null {
  // Handle formats like "John 3:16", "Proverbs 3:5-6", "Romans 8", etc.
  const parsed = parseScriptureReference(reference);

  if (!parsed) {
    return null;
  }

  // Convert API book format back to display format
  const bookDisplay = parsed.book
    .replace(/(\d)([a-z])/i, '$1 $2') // "1john" -> "1 john"
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    book: bookDisplay,
    chapter: parsed.chapter,
    verse: parsed.verseStart,
    verseEnd: parsed.verseEnd,
  };
}

/**
 * Build a URL for navigating to the Scripture tab with a specific passage
 */
export function buildScriptureUrl(navigation: ScriptureNavigation): string {
  const params = new URLSearchParams();
  params.set('tab', 'scripture');
  params.set('book', navigation.book);
  params.set('chapter', navigation.chapter.toString());

  if (navigation.verse) {
    params.set('verse', navigation.verse.toString());
    if (navigation.verseEnd) {
      params.set('verseEnd', navigation.verseEnd.toString());
    }
  }

  return `/coach?${params.toString()}`;
}

/**
 * Build a URL from a reference string
 */
export function buildScriptureUrlFromReference(reference: string): string | null {
  const navigation = parseNavigationReference(reference);
  if (!navigation) return null;
  return buildScriptureUrl(navigation);
}

/**
 * Extract scripture navigation params from URL search params
 */
export function getScriptureParamsFromUrl(searchParams: URLSearchParams): ScriptureNavigation | null {
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');

  if (!book || !chapter) {
    return null;
  }

  const chapterNum = parseInt(chapter, 10);
  if (isNaN(chapterNum)) {
    return null;
  }

  const verseStr = searchParams.get('verse');
  const verseEndStr = searchParams.get('verseEnd');

  const verse = verseStr ? parseInt(verseStr, 10) : undefined;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;

  return {
    book,
    chapter: chapterNum,
    verse: isNaN(verse as number) ? undefined : verse,
    verseEnd: isNaN(verseEnd as number) ? undefined : verseEnd,
  };
}

/**
 * Build a URL for the Related Verses Study view
 */
export function buildStudyUrl(reference: string): string {
  return `/coach?tab=scripture&study=${encodeURIComponent(reference)}`;
}
