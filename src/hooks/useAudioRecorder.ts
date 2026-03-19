'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'error';

export interface RecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  mimeType: string;
}

export interface UseAudioRecorderReturn {
  status: RecordingStatus;
  duration: number;
  audioLevel: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingResult | null>;
  discardRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  // Get preferred MIME type
  const getMimeType = useCallback((): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }, []);

  // Update audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || status !== 'recording') {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    setAudioLevel(normalizedLevel);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [status]);

  // Start the timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current;
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
    }, 100);
  }, []);

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    pausedDurationRef.current = Date.now() - startTimeRef.current;
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setStatus('requesting-permission');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      setStatus('ready');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setStatus('permission-denied');
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setStatus('error');
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setStatus('error');
        setError(`Could not access microphone: ${errorMessage}`);
      }
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    audioChunksRef.current = [];
    pausedDurationRef.current = 0;

    // Clean up any previous recording URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    try {
      setStatus('requesting-permission');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        setStatus('error');
        cleanup();
      };

      // Start recording with timeslice for continuous data
      mediaRecorder.start(1000);
      setStatus('recording');
      setDuration(0);
      startTimer();
      updateAudioLevel();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setStatus('permission-denied');
        setError('Microphone access was denied. Please allow microphone access to record.');
      } else if (errorMessage.includes('NotFoundError')) {
        setStatus('error');
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setStatus('error');
        setError(`Could not start recording: ${errorMessage}`);
      }
      cleanup();
    }
  }, [audioUrl, getMimeType, startTimer, updateAudioLevel, cleanup]);

  // Pause recording
  const pauseRecording = useCallback((): void => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      stopTimer();
      setAudioLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [status, stopTimer]);

  // Resume recording
  const resumeRecording = useCallback((): void => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      startTimer();
      updateAudioLevel();
    }
  }, [status, startTimer, updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!mediaRecorderRef.current || (status !== 'recording' && status !== 'paused')) {
      return null;
    }

    setStatus('processing');
    stopTimer();
    setAudioLevel(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      const mimeType = mediaRecorder.mimeType;

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus('completed');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        resolve({
          audioBlob: blob,
          audioUrl: url,
          duration,
          mimeType,
        });
      };

      mediaRecorder.stop();
    });
  }, [status, duration, stopTimer]);

  // Discard recording
  const discardRecording = useCallback((): void => {
    cleanup();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setAudioLevel(0);
    setError(null);
    setStatus('idle');
    audioChunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [audioUrl, cleanup]);

  return {
    status,
    duration,
    audioLevel,
    audioUrl,
    audioBlob,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    requestPermission,
  };
}
