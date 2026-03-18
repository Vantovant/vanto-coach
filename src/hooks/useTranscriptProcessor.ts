'use client';

import { useState, useCallback } from 'react';
import { AI_CONFIG, type AIProcessingResponse, type ProcessedTranscriptData } from '@/lib/ai/config';

export type ProcessingStatus =
  | 'idle'
  | 'processing'
  | 'completed'
  | 'error';

export interface ProcessedTranscript {
  rawTranscript: string;
  cleanedTranscript: string;
  summary: string;
  keyTopics: string[];
  mood: string | null;
  moodConfidence: number;
  actionItems: string[];
  prayerPoints: string[];
  scriptureReferences: string[];
  spiritualThemes: string[];
  coachingInsight?: string;
  // Metadata
  processedAt: string;
  processingMethod: 'openai' | 'fallback';
}

export interface UseTranscriptProcessorReturn {
  status: ProcessingStatus;
  progress: number;
  result: ProcessedTranscript | null;
  error: string | null;
  isUsingFallback: boolean;
  processTranscript: (rawTranscript: string) => Promise<ProcessedTranscript | null>;
  reset: () => void;
}

/**
 * Hook for AI-powered transcript processing
 *
 * Uses OpenAI API when available, falls back to local processing
 * if API key is not configured or API call fails.
 */
export function useTranscriptProcessor(): UseTranscriptProcessorReturn {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessedTranscript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const processTranscript = useCallback(async (rawTranscript: string): Promise<ProcessedTranscript | null> => {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
      setError('No transcript to process');
      setStatus('error');
      return null;
    }

    try {
      setStatus('processing');
      setProgress(10);
      setError(null);
      setIsUsingFallback(false);

      // Simulate initial progress
      setProgress(20);

      // Call the API route
      const response = await fetch(AI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: rawTranscript,
          options: {
            generateSummary: true,
            extractActions: true,
            extractPrayers: true,
            detectMood: true,
            cleanTranscript: true,
          },
        }),
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResponse: AIProcessingResponse = await response.json();

      setProgress(80);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || 'Processing failed');
      }

      // Track if fallback was used
      if (apiResponse.fallbackUsed) {
        setIsUsingFallback(true);
      }

      setProgress(90);

      // Transform API response to ProcessedTranscript
      const processed: ProcessedTranscript = {
        rawTranscript: apiResponse.data.rawTranscript,
        cleanedTranscript: apiResponse.data.cleanedTranscript,
        summary: apiResponse.data.summary,
        keyTopics: apiResponse.data.keyTopics,
        mood: apiResponse.data.mood,
        moodConfidence: apiResponse.data.moodConfidence,
        actionItems: apiResponse.data.actionItems,
        prayerPoints: apiResponse.data.prayerPoints,
        scriptureReferences: apiResponse.data.scriptureReferences,
        spiritualThemes: apiResponse.data.spiritualThemes,
        coachingInsight: apiResponse.data.coachingInsight,
        processedAt: new Date().toISOString(),
        processingMethod: apiResponse.fallbackUsed ? 'fallback' : 'openai',
      };

      setProgress(100);
      setResult(processed);
      setStatus('completed');

      return processed;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      console.error('Transcript processing error:', err);
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setIsUsingFallback(false);
  }, []);

  return {
    status,
    progress,
    result,
    error,
    isUsingFallback,
    processTranscript,
    reset,
  };
}
