// Bible API Service
// Uses bible-api.com - free, no API key required
// Supports multiple translations: KJV, ASV, WEB, etc.

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation: string;
}

export interface BibleLookupResult {
  success: boolean;
  passage?: BiblePassage;
  error?: string;
}

// Normalize book names to API-compatible format
const BOOK_ALIASES: Record<string, string> = {
  'genesis': 'genesis',
  'gen': 'genesis',
  'exodus': 'exodus',
  'ex': 'exodus',
  'leviticus': 'leviticus',
  'lev': 'leviticus',
  'numbers': 'numbers',
  'num': 'numbers',
  'deuteronomy': 'deuteronomy',
  'deut': 'deuteronomy',
  'joshua': 'joshua',
  'josh': 'joshua',
  'judges': 'judges',
  'judg': 'judges',
  'ruth': 'ruth',
  '1 samuel': '1samuel',
  '1samuel': '1samuel',
  '1 sam': '1samuel',
  '2 samuel': '2samuel',
  '2samuel': '2samuel',
  '2 sam': '2samuel',
  '1 kings': '1kings',
  '1kings': '1kings',
  '1 kgs': '1kings',
  '2 kings': '2kings',
  '2kings': '2kings',
  '2 kgs': '2kings',
  '1 chronicles': '1chronicles',
  '1chronicles': '1chronicles',
  '1 chr': '1chronicles',
  '2 chronicles': '2chronicles',
  '2chronicles': '2chronicles',
  '2 chr': '2chronicles',
  'ezra': 'ezra',
  'nehemiah': 'nehemiah',
  'neh': 'nehemiah',
  'esther': 'esther',
  'job': 'job',
  'psalm': 'psalms',
  'psalms': 'psalms',
  'ps': 'psalms',
  'proverbs': 'proverbs',
  'prov': 'proverbs',
  'ecclesiastes': 'ecclesiastes',
  'eccl': 'ecclesiastes',
  'song of solomon': 'songofsolomon',
  'song of songs': 'songofsolomon',
  'songs': 'songofsolomon',
  'isaiah': 'isaiah',
  'isa': 'isaiah',
  'jeremiah': 'jeremiah',
  'jer': 'jeremiah',
  'lamentations': 'lamentations',
  'lam': 'lamentations',
  'ezekiel': 'ezekiel',
  'ezek': 'ezekiel',
  'daniel': 'daniel',
  'dan': 'daniel',
  'hosea': 'hosea',
  'hos': 'hosea',
  'joel': 'joel',
  'amos': 'amos',
  'obadiah': 'obadiah',
  'obad': 'obadiah',
  'jonah': 'jonah',
  'micah': 'micah',
  'mic': 'micah',
  'nahum': 'nahum',
  'nah': 'nahum',
  'habakkuk': 'habakkuk',
  'hab': 'habakkuk',
  'zephaniah': 'zephaniah',
  'zeph': 'zephaniah',
  'haggai': 'haggai',
  'hag': 'haggai',
  'zechariah': 'zechariah',
  'zech': 'zechariah',
  'malachi': 'malachi',
  'mal': 'malachi',
  'matthew': 'matthew',
  'matt': 'matthew',
  'mt': 'matthew',
  'mark': 'mark',
  'mk': 'mark',
  'luke': 'luke',
  'lk': 'luke',
  'john': 'john',
  'jn': 'john',
  'acts': 'acts',
  'romans': 'romans',
  'rom': 'romans',
  '1 corinthians': '1corinthians',
  '1corinthians': '1corinthians',
  '1 cor': '1corinthians',
  '2 corinthians': '2corinthians',
  '2corinthians': '2corinthians',
  '2 cor': '2corinthians',
  'galatians': 'galatians',
  'gal': 'galatians',
  'ephesians': 'ephesians',
  'eph': 'ephesians',
  'philippians': 'philippians',
  'phil': 'philippians',
  'colossians': 'colossians',
  'col': 'colossians',
  '1 thessalonians': '1thessalonians',
  '1thessalonians': '1thessalonians',
  '1 thess': '1thessalonians',
  '2 thessalonians': '2thessalonians',
  '2thessalonians': '2thessalonians',
  '2 thess': '2thessalonians',
  '1 timothy': '1timothy',
  '1timothy': '1timothy',
  '1 tim': '1timothy',
  '2 timothy': '2timothy',
  '2timothy': '2timothy',
  '2 tim': '2timothy',
  'titus': 'titus',
  'philemon': 'philemon',
  'phlm': 'philemon',
  'hebrews': 'hebrews',
  'heb': 'hebrews',
  'james': 'james',
  'jas': 'james',
  '1 peter': '1peter',
  '1peter': '1peter',
  '1 pet': '1peter',
  '2 peter': '2peter',
  '2peter': '2peter',
  '2 pet': '2peter',
  '1 john': '1john',
  '1john': '1john',
  '2 john': '2john',
  '2john': '2john',
  '3 john': '3john',
  '3john': '3john',
  'jude': 'jude',
  'revelation': 'revelation',
  'rev': 'revelation',
};

/**
 * Parse a scripture reference string into components
 * Examples: "John 3:16", "Psalm 23:1-6", "Romans 8:28", "1 Corinthians 13"
 */
export function parseScriptureReference(reference: string): {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
} | null {
  // Regex to match various scripture formats
  const regex = /^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/i;
  const match = reference.trim().match(regex);

  if (!match) return null;

  const [, bookPart, chapterStr, verseStartStr, verseEndStr] = match;
  const bookLower = bookPart.toLowerCase().trim();
  const normalizedBook = BOOK_ALIASES[bookLower];

  if (!normalizedBook) return null;

  return {
    book: normalizedBook,
    chapter: parseInt(chapterStr, 10),
    verseStart: verseStartStr ? parseInt(verseStartStr, 10) : undefined,
    verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : undefined,
  };
}

/**
 * Format a reference for API request
 */
export function formatApiReference(parsed: {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}): string {
  let ref = `${parsed.book}+${parsed.chapter}`;
  if (parsed.verseStart) {
    ref += `:${parsed.verseStart}`;
    if (parsed.verseEnd) {
      ref += `-${parsed.verseEnd}`;
    }
  }
  return ref;
}

/**
 * Format a reference for display
 */
export function formatDisplayReference(parsed: {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}): string {
  // Capitalize book name nicely
  const bookDisplay = parsed.book
    .replace(/(\d)([a-z])/i, '$1 $2') // "1john" -> "1 john"
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  let ref = `${bookDisplay} ${parsed.chapter}`;
  if (parsed.verseStart) {
    ref += `:${parsed.verseStart}`;
    if (parsed.verseEnd) {
      ref += `-${parsed.verseEnd}`;
    }
  }
  return ref;
}

/**
 * Fetch a Bible passage from the API
 */
export async function fetchBiblePassage(
  reference: string,
  translation: string = 'kjv'
): Promise<BibleLookupResult> {
  try {
    const parsed = parseScriptureReference(reference);
    if (!parsed) {
      return {
        success: false,
        error: 'Invalid scripture reference format',
      };
    }

    const apiRef = formatApiReference(parsed);
    const url = `https://bible-api.com/${apiRef}?translation=${translation}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Passage not found',
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    interface ApiVerse {
      book_name?: string;
      chapter?: number;
      verse: number;
      text?: string;
    }

    const verses: BibleVerse[] = (data.verses || []).map((v: ApiVerse) => ({
      book: v.book_name || parsed.book,
      chapter: v.chapter || parsed.chapter,
      verse: v.verse,
      text: v.text?.trim() || '',
    }));

    return {
      success: true,
      passage: {
        reference: formatDisplayReference(parsed),
        verses,
        text: data.text?.trim() || verses.map(v => v.text).join(' '),
        translation: translation.toUpperCase(),
      },
    };
  } catch (error) {
    console.error('Bible API error:', error);
    return {
      success: false,
      error: 'Failed to fetch passage',
    };
  }
}

/**
 * Fetch multiple passages in parallel
 */
export async function fetchMultiplePassages(
  references: string[],
  translation: string = 'kjv'
): Promise<Map<string, BibleLookupResult>> {
  const results = new Map<string, BibleLookupResult>();

  const promises = references.map(async (ref) => {
    const result = await fetchBiblePassage(ref, translation);
    results.set(ref, result);
  });

  await Promise.all(promises);
  return results;
}
