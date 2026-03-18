'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BiblePassage, BibleLookupResult } from '@/lib/bible/api';

export interface UseBibleVerseReturn {
  passage: BiblePassage | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseBibleVersesReturn {
  passages: Map<string, BiblePassage | null>;
  isLoading: boolean;
  errors: Map<string, string>;
  refetch: () => void;
}

/**
 * Hook to fetch a single Bible verse/passage
 */
export function useBibleVerse(
  reference: string | null,
  translation: string = 'kjv'
): UseBibleVerseReturn {
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerse = useCallback(async () => {
    if (!reference) {
      setPassage(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/bible/verse?ref=${encodeURIComponent(reference)}&translation=${translation}`
      );
      const data: BibleLookupResult = await response.json();

      if (data.success && data.passage) {
        setPassage(data.passage);
        setError(null);
      } else {
        setPassage(null);
        setError(data.error || 'Failed to load verse');
      }
    } catch (err) {
      setPassage(null);
      setError('Failed to load verse');
    } finally {
      setIsLoading(false);
    }
  }, [reference, translation]);

  useEffect(() => {
    fetchVerse();
  }, [fetchVerse]);

  return {
    passage,
    isLoading,
    error,
    refetch: fetchVerse,
  };
}

/**
 * Hook to fetch multiple Bible verses/passages
 */
export function useBibleVerses(
  references: string[],
  translation: string = 'kjv'
): UseBibleVersesReturn {
  const [passages, setPassages] = useState<Map<string, BiblePassage | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const fetchVerses = useCallback(async () => {
    if (!references || references.length === 0) {
      setPassages(new Map());
      setErrors(new Map());
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/bible/verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ references, translation }),
      });

      const data = await response.json();

      if (data.success && data.results) {
        const newPassages = new Map<string, BiblePassage | null>();
        const newErrors = new Map<string, string>();

        for (const [ref, result] of Object.entries(data.results)) {
          const typedResult = result as BibleLookupResult;
          if (typedResult.success && typedResult.passage) {
            newPassages.set(ref, typedResult.passage);
          } else {
            newPassages.set(ref, null);
            newErrors.set(ref, typedResult.error || 'Failed to load');
          }
        }

        setPassages(newPassages);
        setErrors(newErrors);
      }
    } catch (err) {
      const newErrors = new Map<string, string>();
      references.forEach(ref => newErrors.set(ref, 'Failed to load'));
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  }, [references, translation]);

  // Create a stable reference key for the effect
  const referencesKey = references.join(',');

  useEffect(() => {
    fetchVerses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencesKey, translation]);

  return {
    passages,
    isLoading,
    errors,
    refetch: fetchVerses,
  };
}
