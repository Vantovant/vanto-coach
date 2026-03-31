'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export type LiveSpeechPreviewStatus =
  | 'idle'
  | 'listening'
  | 'paused'
  | 'stopped'
  | 'unsupported'
  | 'failed';

export interface UseLiveSpeechPreviewReturn {
  supported: boolean;
  previewStatus: LiveSpeechPreviewStatus;
  interimText: string;
  committedText: string;
  error: string | null;
  startPreview: () => void;
  stopPreview: () => void;
  pausePreview: () => void;
  resumePreview: () => void;
  resetPreview: () => void;
}

interface LiveSpeechPreviewOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

function normalizeSpeechSegment(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function appendUniqueTranscript(existing: string, incoming: string): string {
  const normalizedIncoming = normalizeSpeechSegment(incoming);
  if (!normalizedIncoming) return existing;

  const normalizedExisting = normalizeSpeechSegment(existing);
  if (!normalizedExisting) return normalizedIncoming;
  if (normalizedExisting === normalizedIncoming) return existing;
  if (normalizedExisting.endsWith(normalizedIncoming)) return existing;
  if (normalizedIncoming.startsWith(normalizedExisting)) return normalizedIncoming;

  return `${existing.trim()} ${normalizedIncoming}`.trim();
}

export function useLiveSpeechPreview(
  options: LiveSpeechPreviewOptions = {}
): UseLiveSpeechPreviewReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [previewStatus, setPreviewStatus] = useState<LiveSpeechPreviewStatus>('idle');
  const [interimText, setInterimText] = useState('');
  const [committedText, setCommittedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isPausedRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const initRecognitionRef = useRef<(() => SpeechRecognition | null) | null>(null);
  const lastFinalSegmentRef = useRef('');
  const committedTextRef = useRef('');
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const speechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!speechApi) {
      setSupported(false);
      setPreviewStatus('unsupported');
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    }
  }, []);

  const initRecognition = useCallback(() => {
    const speechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!speechApi) {
      return null;
    }

    const recognition = new speechApi();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setPreviewStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let nextCommitted = committedTextRef.current;
      let nextInterim = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = normalizeSpeechSegment(result[0].transcript);
        if (!text) continue;

        if (result.isFinal) {
          if (text === lastFinalSegmentRef.current) {
            continue;
          }

          lastFinalSegmentRef.current = text;
          nextCommitted = appendUniqueTranscript(nextCommitted, text);
          continue;
        }

        nextInterim = appendUniqueTranscript(nextCommitted, text);
      }

      committedTextRef.current = nextCommitted;
      setCommittedText(nextCommitted);
      setInterimText(nextInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      switch (event.error) {
        case 'no-speech':
        case 'aborted':
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your audio input.');
          setPreviewStatus('failed');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          setPreviewStatus('failed');
          break;
        case 'network':
          setError('Network error occurred. Please check your connection.');
          setPreviewStatus('failed');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
          setPreviewStatus('failed');
      }
    };

    recognition.onend = () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      if (shouldRestartRef.current && !isPausedRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (!shouldRestartRef.current || isPausedRef.current) return;
          const nextRecognition = initRecognitionRef.current?.();
          if (nextRecognition) {
            recognitionRef.current = nextRecognition;
            try {
              nextRecognition.start();
            } catch {
            }
          }
        }, 600);
      } else if (!isPausedRef.current) {
        setPreviewStatus('stopped');
      }
    };

    return recognition;
  }, [continuous, interimResults, language, maxAlternatives]);

  useEffect(() => {
    initRecognitionRef.current = initRecognition;
  }, [initRecognition]);
  useEffect(() => {
    committedTextRef.current = committedText;
  }, [committedText]);


  const startPreview = useCallback(() => {
    if (!supported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setError(null);
    setInterimText('');
    setCommittedText('');
    committedTextRef.current = '';
    lastFinalSegmentRef.current = '';
    isPausedRef.current = false;
    shouldRestartRef.current = true;
    recognitionRef.current = initRecognition();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        setError('Failed to start live preview. Please try again.');
        setPreviewStatus('failed');
      }
    }
  }, [initRecognition, supported]);

  const stopPreview = useCallback(() => {
    shouldRestartRef.current = false;
    isPausedRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
      }
    }

    setPreviewStatus('stopped');
    setInterimText('');
  }, []);

  const pausePreview = useCallback(() => {
    isPausedRef.current = true;
    shouldRestartRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
      }
    }

    setPreviewStatus('paused');
    setInterimText('');
  }, []);

  const resumePreview = useCallback(() => {
    if (!supported) return;

    isPausedRef.current = false;
    shouldRestartRef.current = true;
    recognitionRef.current = initRecognition();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        setError('Failed to resume live preview. Please try again.');
        setPreviewStatus('failed');
      }
    }
  }, [initRecognition, supported]);

  const resetPreview = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    setInterimText('');
    setCommittedText('');
    committedTextRef.current = '';
    lastFinalSegmentRef.current = '';
    setError(null);
    setPreviewStatus(supported ? 'idle' : 'unsupported');
  }, [supported]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
        }
      }
    };
  }, []);

  return {
    supported,
    previewStatus,
    interimText,
    committedText,
    error,
    startPreview,
    stopPreview,
    pausePreview,
    resumePreview,
    resetPreview,
  };
}
