// Cross-Reference Data Layer
// Curated relationships between scripture passages for deeper study
// Organized by themes relevant to Christian life coaching

export interface CrossReference {
  reference: string;
  theme: string;
  relevance: 'direct' | 'thematic' | 'complementary';
}

export interface CrossReferenceEntry {
  themes: string[];
  related: CrossReference[];
}

// Normalized key format: "book chapter:verse" lowercase, no spaces in book
function normalizeKey(reference: string): string {
  return reference
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(\d)([a-z])/i, '$1$2'); // "1 john" -> "1john"
}

// Cross-reference database organized by verse
// This can be expanded over time or connected to an API
const CROSS_REFERENCES: Record<string, CrossReferenceEntry> = {
  // Trust & Faith
  'proverbs3:5': {
    themes: ['trust', 'faith', 'guidance'],
    related: [
      { reference: 'Proverbs 3:6', theme: 'guidance', relevance: 'direct' },
      { reference: 'Jeremiah 29:11', theme: 'trust in God\'s plan', relevance: 'thematic' },
      { reference: 'Isaiah 26:3', theme: 'peace through trust', relevance: 'thematic' },
      { reference: 'Psalm 37:5', theme: 'commit to the Lord', relevance: 'complementary' },
    ],
  },
  'proverbs3:6': {
    themes: ['guidance', 'direction', 'faith'],
    related: [
      { reference: 'Proverbs 3:5', theme: 'trust foundation', relevance: 'direct' },
      { reference: 'Psalm 32:8', theme: 'God guides us', relevance: 'thematic' },
      { reference: 'Isaiah 30:21', theme: 'hearing God\'s voice', relevance: 'thematic' },
    ],
  },
  'jeremiah29:11': {
    themes: ['hope', 'future', 'God\'s plan'],
    related: [
      { reference: 'Romans 8:28', theme: 'all things work together', relevance: 'thematic' },
      { reference: 'Proverbs 19:21', theme: 'God\'s purpose prevails', relevance: 'complementary' },
      { reference: 'Psalm 138:8', theme: 'God fulfills His purpose', relevance: 'thematic' },
      { reference: 'Philippians 1:6', theme: 'God completes His work', relevance: 'complementary' },
    ],
  },

  // Strength & Courage
  'philippians4:13': {
    themes: ['strength', 'ability', 'Christ'],
    related: [
      { reference: 'Isaiah 40:31', theme: 'renewed strength', relevance: 'thematic' },
      { reference: '2 Corinthians 12:9', theme: 'strength in weakness', relevance: 'complementary' },
      { reference: 'Ephesians 6:10', theme: 'strength in the Lord', relevance: 'thematic' },
      { reference: 'Joshua 1:9', theme: 'courage and strength', relevance: 'complementary' },
    ],
  },
  'isaiah40:31': {
    themes: ['strength', 'waiting', 'renewal'],
    related: [
      { reference: 'Psalm 27:14', theme: 'wait on the Lord', relevance: 'thematic' },
      { reference: 'Philippians 4:13', theme: 'strength through Christ', relevance: 'complementary' },
      { reference: 'Lamentations 3:25', theme: 'God is good to those who wait', relevance: 'thematic' },
    ],
  },
  'joshua1:9': {
    themes: ['courage', 'strength', 'God\'s presence'],
    related: [
      { reference: 'Deuteronomy 31:6', theme: 'God goes with you', relevance: 'direct' },
      { reference: 'Isaiah 41:10', theme: 'do not fear', relevance: 'thematic' },
      { reference: 'Psalm 27:1', theme: 'the Lord is my light', relevance: 'complementary' },
    ],
  },

  // Peace & Anxiety
  'philippians4:6': {
    themes: ['anxiety', 'prayer', 'peace'],
    related: [
      { reference: 'Philippians 4:7', theme: 'peace of God', relevance: 'direct' },
      { reference: '1 Peter 5:7', theme: 'cast your cares', relevance: 'thematic' },
      { reference: 'Matthew 6:25', theme: 'do not worry', relevance: 'thematic' },
      { reference: 'Isaiah 26:3', theme: 'perfect peace', relevance: 'complementary' },
    ],
  },
  'philippians4:7': {
    themes: ['peace', 'guarding', 'heart'],
    related: [
      { reference: 'Philippians 4:6', theme: 'prayer over anxiety', relevance: 'direct' },
      { reference: 'John 14:27', theme: 'peace I leave with you', relevance: 'thematic' },
      { reference: 'Colossians 3:15', theme: 'let peace rule', relevance: 'complementary' },
    ],
  },
  'isaiah26:3': {
    themes: ['peace', 'trust', 'mind'],
    related: [
      { reference: 'Philippians 4:7', theme: 'peace guards hearts', relevance: 'thematic' },
      { reference: 'Romans 8:6', theme: 'mind on Spirit is peace', relevance: 'complementary' },
      { reference: 'John 16:33', theme: 'peace in tribulation', relevance: 'thematic' },
    ],
  },

  // Love
  'john3:16': {
    themes: ['love', 'salvation', 'eternal life'],
    related: [
      { reference: 'Romans 5:8', theme: 'God\'s love demonstrated', relevance: 'thematic' },
      { reference: '1 John 4:9', theme: 'God sent His Son', relevance: 'thematic' },
      { reference: 'Ephesians 2:8', theme: 'saved by grace', relevance: 'complementary' },
      { reference: 'John 3:17', theme: 'salvation not condemnation', relevance: 'direct' },
    ],
  },
  'romans8:28': {
    themes: ['sovereignty', 'purpose', 'good'],
    related: [
      { reference: 'Jeremiah 29:11', theme: 'plans for good', relevance: 'thematic' },
      { reference: 'Genesis 50:20', theme: 'meant for good', relevance: 'complementary' },
      { reference: 'Romans 8:29', theme: 'conformed to Christ', relevance: 'direct' },
      { reference: 'Ephesians 1:11', theme: 'works all things', relevance: 'thematic' },
    ],
  },

  // Wisdom & Guidance
  'james1:5': {
    themes: ['wisdom', 'asking', 'faith'],
    related: [
      { reference: 'Proverbs 2:6', theme: 'Lord gives wisdom', relevance: 'thematic' },
      { reference: 'James 1:6', theme: 'ask in faith', relevance: 'direct' },
      { reference: 'Colossians 2:3', theme: 'treasures of wisdom', relevance: 'complementary' },
      { reference: 'Proverbs 3:13', theme: 'blessed who finds wisdom', relevance: 'thematic' },
    ],
  },
  'psalm32:8': {
    themes: ['guidance', 'teaching', 'instruction'],
    related: [
      { reference: 'Proverbs 3:6', theme: 'He directs paths', relevance: 'thematic' },
      { reference: 'Isaiah 30:21', theme: 'this is the way', relevance: 'thematic' },
      { reference: 'Psalm 25:9', theme: 'guides the humble', relevance: 'complementary' },
    ],
  },

  // Rest & Comfort
  'psalm23:1': {
    themes: ['provision', 'shepherd', 'contentment'],
    related: [
      { reference: 'Psalm 23:2', theme: 'green pastures', relevance: 'direct' },
      { reference: 'John 10:11', theme: 'good shepherd', relevance: 'thematic' },
      { reference: 'Philippians 4:19', theme: 'God supplies needs', relevance: 'complementary' },
    ],
  },
  'matthew11:28': {
    themes: ['rest', 'burden', 'invitation'],
    related: [
      { reference: 'Matthew 11:29', theme: 'learn from me', relevance: 'direct' },
      { reference: 'Matthew 11:30', theme: 'yoke is easy', relevance: 'direct' },
      { reference: 'Psalm 55:22', theme: 'cast burden on Lord', relevance: 'thematic' },
      { reference: 'Hebrews 4:9', theme: 'Sabbath rest remains', relevance: 'complementary' },
    ],
  },

  // Identity & Purpose
  '2corinthians5:17': {
    themes: ['new creation', 'identity', 'transformation'],
    related: [
      { reference: 'Galatians 2:20', theme: 'Christ lives in me', relevance: 'thematic' },
      { reference: 'Ephesians 2:10', theme: 'created for good works', relevance: 'complementary' },
      { reference: 'Romans 6:4', theme: 'walk in newness', relevance: 'thematic' },
    ],
  },
  'ephesians2:10': {
    themes: ['purpose', 'works', 'creation'],
    related: [
      { reference: '2 Corinthians 5:17', theme: 'new creation', relevance: 'thematic' },
      { reference: 'Philippians 2:13', theme: 'God works in you', relevance: 'complementary' },
      { reference: 'Colossians 1:10', theme: 'walk worthy', relevance: 'thematic' },
    ],
  },

  // Fear & Courage
  'isaiah41:10': {
    themes: ['fear', 'strength', 'God\'s presence'],
    related: [
      { reference: 'Deuteronomy 31:6', theme: 'God will not forsake', relevance: 'thematic' },
      { reference: 'Joshua 1:9', theme: 'be strong and courageous', relevance: 'complementary' },
      { reference: 'Psalm 46:1', theme: 'God is our refuge', relevance: 'thematic' },
      { reference: '2 Timothy 1:7', theme: 'spirit of power', relevance: 'complementary' },
    ],
  },
  '2timothy1:7': {
    themes: ['fear', 'power', 'spirit'],
    related: [
      { reference: 'Romans 8:15', theme: 'spirit of adoption', relevance: 'thematic' },
      { reference: 'Isaiah 41:10', theme: 'do not fear', relevance: 'complementary' },
      { reference: '1 John 4:18', theme: 'perfect love casts out fear', relevance: 'thematic' },
    ],
  },

  // Faithfulness & Perseverance
  'lamentations3:22': {
    themes: ['mercy', 'faithfulness', 'compassion'],
    related: [
      { reference: 'Lamentations 3:23', theme: 'new every morning', relevance: 'direct' },
      { reference: 'Psalm 136:1', theme: 'steadfast love endures', relevance: 'thematic' },
      { reference: 'Romans 5:8', theme: 'God\'s love for us', relevance: 'complementary' },
    ],
  },
  'hebrews12:1': {
    themes: ['perseverance', 'race', 'faith'],
    related: [
      { reference: 'Hebrews 12:2', theme: 'looking to Jesus', relevance: 'direct' },
      { reference: '1 Corinthians 9:24', theme: 'run to win', relevance: 'thematic' },
      { reference: 'Philippians 3:14', theme: 'press toward the goal', relevance: 'complementary' },
    ],
  },

  // Prayer
  '1thessalonians5:17': {
    themes: ['prayer', 'continual', 'communion'],
    related: [
      { reference: '1 Thessalonians 5:16', theme: 'rejoice always', relevance: 'direct' },
      { reference: '1 Thessalonians 5:18', theme: 'give thanks', relevance: 'direct' },
      { reference: 'Ephesians 6:18', theme: 'pray at all times', relevance: 'thematic' },
      { reference: 'Colossians 4:2', theme: 'devote to prayer', relevance: 'complementary' },
    ],
  },

  // Work & Calling
  'colossians3:23': {
    themes: ['work', 'service', 'calling'],
    related: [
      { reference: 'Colossians 3:24', theme: 'heavenly reward', relevance: 'direct' },
      { reference: 'Ephesians 6:7', theme: 'serve wholeheartedly', relevance: 'thematic' },
      { reference: '1 Corinthians 10:31', theme: 'do all to God\'s glory', relevance: 'thematic' },
      { reference: 'Ecclesiastes 9:10', theme: 'work with all might', relevance: 'complementary' },
    ],
  },
  'colossians3:24': {
    themes: ['reward', 'service', 'inheritance'],
    related: [
      { reference: 'Colossians 3:23', theme: 'work as for the Lord', relevance: 'direct' },
      { reference: 'Matthew 25:21', theme: 'faithful servant', relevance: 'thematic' },
      { reference: 'Hebrews 11:6', theme: 'God rewards those who seek', relevance: 'complementary' },
    ],
  },
  'ephesians6:7': {
    themes: ['service', 'attitude', 'work'],
    related: [
      { reference: 'Colossians 3:23', theme: 'work as for Lord', relevance: 'thematic' },
      { reference: 'Galatians 6:9', theme: 'do not grow weary', relevance: 'complementary' },
      { reference: 'Romans 12:11', theme: 'serve with zeal', relevance: 'thematic' },
    ],
  },
  '1corinthians10:31': {
    themes: ['glory', 'purpose', 'everything'],
    related: [
      { reference: 'Colossians 3:17', theme: 'do all in Jesus\' name', relevance: 'thematic' },
      { reference: 'Romans 14:8', theme: 'live to the Lord', relevance: 'thematic' },
      { reference: 'Colossians 3:23', theme: 'work as for the Lord', relevance: 'complementary' },
    ],
  },

  // Self-Control & Leadership
  'proverbs16:32': {
    themes: ['self-control', 'patience', 'strength'],
    related: [
      { reference: 'Proverbs 25:28', theme: 'city without walls', relevance: 'thematic' },
      { reference: 'James 1:19', theme: 'slow to anger', relevance: 'thematic' },
      { reference: 'Galatians 5:22', theme: 'fruit of Spirit', relevance: 'complementary' },
      { reference: 'Proverbs 14:29', theme: 'slow to wrath', relevance: 'direct' },
    ],
  },
  'proverbs14:29': {
    themes: ['patience', 'wisdom', 'anger'],
    related: [
      { reference: 'Proverbs 16:32', theme: 'rule your spirit', relevance: 'direct' },
      { reference: 'James 1:20', theme: 'wrath of man', relevance: 'thematic' },
      { reference: 'Ecclesiastes 7:9', theme: 'do not be quick to anger', relevance: 'complementary' },
    ],
  },

  // Example & Influence
  '1timothy4:12': {
    themes: ['example', 'youth', 'leadership'],
    related: [
      { reference: 'Titus 2:7', theme: 'pattern of good works', relevance: 'thematic' },
      { reference: '1 Peter 5:3', theme: 'examples to the flock', relevance: 'thematic' },
      { reference: 'Matthew 5:16', theme: 'let your light shine', relevance: 'complementary' },
    ],
  },
  'matthew5:16': {
    themes: ['light', 'works', 'glory'],
    related: [
      { reference: '1 Timothy 4:12', theme: 'be an example', relevance: 'thematic' },
      { reference: 'Philippians 2:15', theme: 'shine as lights', relevance: 'thematic' },
      { reference: 'John 13:35', theme: 'known by love', relevance: 'complementary' },
    ],
  },
};

/**
 * Get cross-references for a scripture reference
 */
export function getCrossReferences(reference: string): CrossReferenceEntry | null {
  const key = normalizeKey(reference);

  // Try exact match first
  if (CROSS_REFERENCES[key]) {
    return CROSS_REFERENCES[key];
  }

  // Try partial match (e.g., "John 3:16-17" should match "john3:16")
  const baseKey = key.replace(/-\d+$/, ''); // Remove verse range end
  if (CROSS_REFERENCES[baseKey]) {
    return CROSS_REFERENCES[baseKey];
  }

  return null;
}

/**
 * Get cross-references for multiple scripture references
 */
export function getMultipleCrossReferences(
  references: string[]
): Map<string, CrossReferenceEntry | null> {
  const results = new Map<string, CrossReferenceEntry | null>();

  for (const ref of references) {
    results.set(ref, getCrossReferences(ref));
  }

  return results;
}

/**
 * Get all unique themes from cross-references
 */
export function getThemesForReference(reference: string): string[] {
  const entry = getCrossReferences(reference);
  return entry?.themes || [];
}

/**
 * Find verses related by theme
 */
export function findVersesByTheme(theme: string): string[] {
  const verses: string[] = [];

  for (const [key, entry] of Object.entries(CROSS_REFERENCES)) {
    if (entry.themes.some(t => t.toLowerCase().includes(theme.toLowerCase()))) {
      // Convert key back to readable format
      const readable = key
        .replace(/(\d)([a-z])/i, '$1 $2')
        .replace(/(\d+):/, ' $1:')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      verses.push(readable);
    }
  }

  return verses;
}

/**
 * Get the count of available cross-references
 */
export function getCrossReferenceCount(): number {
  return Object.keys(CROSS_REFERENCES).length;
}

/**
 * Check if cross-references are available for a reference
 */
export function hasCrossReferences(reference: string): boolean {
  return getCrossReferences(reference) !== null;
}
