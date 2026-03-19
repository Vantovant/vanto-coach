'use client';

import { useMemo } from 'react';
import {
  getCrossReferences,
  getThemesForReference,
  type CrossReferenceEntry,
  type CrossReference,
} from '@/lib/bible/cross-references';

export interface UseCrossReferencesReturn {
  themes: string[];
  relatedVerses: CrossReference[];
  hasReferences: boolean;
  directReferences: CrossReference[];
  thematicReferences: CrossReference[];
  complementaryReferences: CrossReference[];
}

/**
 * Hook to get cross-references for a scripture reference
 */
export function useCrossReferences(reference: string | null): UseCrossReferencesReturn {
  return useMemo(() => {
    if (!reference) {
      return {
        themes: [],
        relatedVerses: [],
        hasReferences: false,
        directReferences: [],
        thematicReferences: [],
        complementaryReferences: [],
      };
    }

    const entry = getCrossReferences(reference);

    if (!entry) {
      return {
        themes: [],
        relatedVerses: [],
        hasReferences: false,
        directReferences: [],
        thematicReferences: [],
        complementaryReferences: [],
      };
    }

    const directReferences = entry.related.filter(r => r.relevance === 'direct');
    const thematicReferences = entry.related.filter(r => r.relevance === 'thematic');
    const complementaryReferences = entry.related.filter(r => r.relevance === 'complementary');

    return {
      themes: entry.themes,
      relatedVerses: entry.related,
      hasReferences: entry.related.length > 0,
      directReferences,
      thematicReferences,
      complementaryReferences,
    };
  }, [reference]);
}

/**
 * Hook to get themes for a scripture reference
 */
export function useScriptureThemes(reference: string | null): string[] {
  return useMemo(() => {
    if (!reference) return [];
    return getThemesForReference(reference);
  }, [reference]);
}
