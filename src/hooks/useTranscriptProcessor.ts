'use client';

import { useState, useCallback } from 'react';
import { AI_CONFIG, type AIProcessingResponse } from '@/lib/ai/config';
import { captureError, captureMessage } from '@/lib/monitoring';

export type ProcessingStatus =
  | 'idle'
  | 'processing'
  | 'completed'
  | 'error'
  | 'timedOut';

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

/** Client-side hard-stop timeout for AI processing (ms). */
const PROCESSING_TIMEOUT_MS = 45_000;

/**
 * Hook for AI-powered transcript processing.
 *
 * Uses OpenAI API when available, falls back to local processing
 * if API key is not configured or API call fails.
 *
 * Enforces a PROCESSING_TIMEOUT_MS client-side timeout so a stuck
 * network call can never leave the UI in a permanent "processing" state.
 * When the timeout fires the status transitions to 'timedOut'.
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

      setProgress(20);

      // ── Hard client-side timeout ─────────────────────────────────
      // If the fetch does not resolve within PROCESSING_TIMEOUT_MS,
      // the AbortController cancels the request and we transition to
      // 'timedOut' so the UI can surface a clear failed state.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        captureMessage('Transcript processing timed out on client', 'warning', {
          context: 'diary:process',
          timeoutMs: PROCESSING_TIMEOUT_MS,
        });
      }, PROCESSING_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(AI_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        // AbortError means our own timeout fired
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          setError('Processing timed out. You can retry or save as-is.');
          setStatus('timedOut');
          setProgress(0);
          captureMessage('Fetch aborted by client timeout', 'warning', {
            context: 'diary:process',
          });
          return null;
        }
        throw fetchErr; // re-throw non-abort network errors
      }

      clearTimeout(timeoutId);
      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        captureMessage(`AI API returned ${response.status}`, 'error', {
          context: 'diary:process',
          statusCode: response.status,
          errorData,
        });
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResponse: AIProcessingResponse = await response.json();
      setProgress(80);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || 'Processing failed');
      }

      if (apiResponse.fallbackUsed) {
        setIsUsingFallback(true);
        captureMessage('AI processing used local fallback', 'info', {
          context: 'diary:process',
        });
      }

      setProgress(90);

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
      captureError(err, { context: 'diary:process' });
      setError(message);
      setStatus('error');
      setProgress(0);
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
