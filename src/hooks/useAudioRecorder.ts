'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus =
  | 'idle'
  | 'requestingPermission'
  | 'permissionDenied'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'failed';

export interface RecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  mimeType: string;
}

export interface UseAudioRecorderReturn {
  recordingStatus: RecordingStatus;
  durationSeconds: number;
  audioLevel: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  error: string | null;
  supportedMimeType: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingResult | null>;
  discardRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

const MIME_TYPE_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
] as const;

function getSupportedMimeType(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }

  for (const type of MIME_TYPE_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedMimeType, setSupportedMimeType] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

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
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    setSupportedMimeType(getSupportedMimeType());
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || recordingStatus !== 'recording') {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    setAudioLevel(normalizedLevel);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [recordingStatus]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current;
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDurationSeconds(elapsed);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    pausedDurationRef.current = Date.now() - startTimeRef.current;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setRecordingStatus('requestingPermission');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      stream.getTracks().forEach((track) => track.stop());
      setRecordingStatus('ready');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setRecordingStatus('permissionDenied');
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setRecordingStatus('failed');
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setRecordingStatus('failed');
        setError(`Could not access microphone: ${errorMessage}`);
      }
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    audioChunksRef.current = [];
    pausedDurationRef.current = 0;

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    try {
      setRecordingStatus('requestingPermission');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mimeType = getSupportedMimeType();
      setSupportedMimeType(mimeType);
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        setRecordingStatus('failed');
        cleanup();
      };

      mediaRecorder.start(1000);
      setRecordingStatus('recording');
      setDurationSeconds(0);
      startTimer();
      updateAudioLevel();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setRecordingStatus('permissionDenied');
        setError('Microphone access was denied. Please allow microphone access to record.');
      } else if (errorMessage.includes('NotFoundError')) {
        setRecordingStatus('failed');
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setRecordingStatus('failed');
        setError(`Could not start recording: ${errorMessage}`);
      }
      cleanup();
    }
  }, [audioUrl, cleanup, startTimer, updateAudioLevel]);

  const pauseRecording = useCallback((): void => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      stopTimer();
      setAudioLevel(0);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [recordingStatus, stopTimer]);

  const resumeRecording = useCallback((): void => {
    if (mediaRecorderRef.current && recordingStatus === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      startTimer();
      updateAudioLevel();
    }
  }, [recordingStatus, startTimer, updateAudioLevel]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!mediaRecorderRef.current || (recordingStatus !== 'recording' && recordingStatus !== 'paused')) {
      return null;
    }

    setRecordingStatus('stopping');
    stopTimer();
    setAudioLevel(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || supportedMimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setSupportedMimeType(mimeType);
        setRecordingStatus('completed');

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        resolve({
          audioBlob: blob,
          audioUrl: url,
          duration: durationSeconds,
          mimeType,
        });
      };

      mediaRecorder.stop();
    });
  }, [durationSeconds, recordingStatus, stopTimer, supportedMimeType]);

  const discardRecording = useCallback((): void => {
    cleanup();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setDurationSeconds(0);
    setAudioLevel(0);
    setError(null);
    setRecordingStatus('idle');
    audioChunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [audioUrl, cleanup]);

  return {
    recordingStatus,
    durationSeconds,
    audioLevel,
    audioUrl,
    audioBlob,
    error,
    supportedMimeType,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    requestPermission,
  };
}
