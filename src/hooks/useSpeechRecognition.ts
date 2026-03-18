'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API Type Declarations
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
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export type SpeechRecognitionStatus =
  | 'idle'
  | 'not-supported'
  | 'starting'
  | 'listening'
  | 'paused'
  | 'stopped'
  | 'error';

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface UseSpeechRecognitionReturn {
  status: SpeechRecognitionStatus;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  segments: TranscriptSegment[];
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  resetTranscript: () => void;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isPausedRef = useRef(false);
  const shouldRestartRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setStatus('not-supported');
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    }
  }, []);

  // Initialize recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return null;
    }

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += text;

          // Add to segments
          const segment: TranscriptSegment = {
            text: text.trim(),
            isFinal: true,
            confidence,
            timestamp: Date.now(),
          };

          setSegments(prev => [...prev, segment]);
        } else {
          currentInterim += text;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const newText = prev ? `${prev} ${finalTranscript}` : finalTranscript;
          return newText.trim();
        });
      }

      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      switch (event.error) {
        case 'no-speech':
          // This is common and not really an error - just no speech detected
          // Don't set error state, just continue listening
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your audio input.');
          setStatus('error');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          setStatus('error');
          break;
        case 'network':
          setError('Network error occurred. Please check your connection.');
          setStatus('error');
          break;
        case 'aborted':
          // User or system aborted - not an error
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
          setStatus('error');
      }
    };

    recognition.onend = () => {
      // If we should restart (continuous mode and not paused/stopped)
      if (shouldRestartRef.current && !isPausedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or other error - ignore
        }
      } else if (!isPausedRef.current) {
        setStatus('stopped');
      }
    };

    return recognition;
  }, [language, continuous, interimResults, maxAlternatives]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setStatus('starting');
    setError(null);
    isPausedRef.current = false;
    shouldRestartRef.current = true;

    // Create new recognition instance
    recognitionRef.current = initRecognition();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        setError('Failed to start speech recognition. Please try again.');
        setStatus('error');
      }
    }
  }, [isSupported, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    isPausedRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    setStatus('stopped');
    setInterimTranscript('');
  }, []);

  // Pause listening
  const pauseListening = useCallback(() => {
    isPausedRef.current = true;
    shouldRestartRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    setStatus('paused');
    setInterimTranscript('');
  }, []);

  // Resume listening
  const resumeListening = useCallback(() => {
    if (!isSupported) return;

    isPausedRef.current = false;
    shouldRestartRef.current = true;

    // Create new recognition instance
    recognitionRef.current = initRecognition();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to resume speech recognition:', e);
      }
    }
  }, [isSupported, initRecognition]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setSegments([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, []);

  return {
    status,
    isSupported,
    transcript,
    interimTranscript,
    segments,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
  };
}
