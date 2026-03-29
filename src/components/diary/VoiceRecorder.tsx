'use client';

import * as React from 'react';
import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  Trash2,
  Save,
  Loader2,
  Volume2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Settings,
  FileText,
  Edit3,
  Check,
  X,
  Sparkles,
  Target,
  Heart,
  BookMarked,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAudioRecorder, type RecordingResult } from '@/hooks/useAudioRecorder';
import { useLiveSpeechPreview } from '@/hooks/useLiveSpeechPreview';
import { useTranscriptProcessor, type ProcessedTranscript, type ProcessingStatus } from '@/hooks/useTranscriptProcessor';
import { ScriptureList } from '@/components/bible/ScriptureCard';
import fixWebmDuration from 'fix-webm-duration';
import { toast } from 'sonner';
import { trackBetaEvent } from '@/lib/supabase/analytics';
import { captureError, captureMessage } from '@/lib/monitoring';
import { uploadAudio, downloadAudio, getSignedAudioUrl } from '@/lib/supabase/storage';

export interface ExtendedRecordingResult extends RecordingResult {
  transcript: string;
  cleanedTranscript?: string;
  summary?: string;
  keyTopics?: string[];
  mood?: string | null;
  actionItems?: string[];
  prayerPoints?: string[];
  coachingInsight?: string | null;
  isAIProcessed?: boolean;
}

interface VoiceRecorderProps {
  onComplete: (result: ExtendedRecordingResult | null) => void;
  onCancel?: () => void;
}

type PersistedAudioRecovery = {
  storagePath: string;
  mimeType: string;
  durationSeconds: number;
  savedAt: number;
};

const RECOVERY_STORAGE_KEY = 'vanto-coach:pending-audio-recovery';

type TranscribeRouteResponse = {
  success?: boolean;
  transcript?: string;
  error?: string;
  errorCode?: string;
  detail?: {
    upstreamStatus?: number;
    upstreamBody?: string;
    submittedMimeType?: string;
    filename?: string;
    extension?: string;
  };
  missing_env?: string;
};

function getExtFromMimeType(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

function readRecoveryState(): PersistedAudioRecovery | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAudioRecovery;
  } catch {
    return null;
  }
}

function writeRecoveryState(value: PersistedAudioRecovery | null) {
  if (typeof window === 'undefined') return;
  if (!value) {
    window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(value));
}

export function VoiceRecorder({ onComplete, onCancel }: VoiceRecorderProps) {
  const {
    recordingStatus,
    durationSeconds,
    audioLevel,
    audioUrl,
    audioBlob,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
  } = useAudioRecorder();

  const {
    previewStatus,
    supported: isSpeechSupported,
    interimText,
    error: speechError,
    startPreview,
    stopPreview,
    pausePreview,
    resumePreview,
    resetPreview,
  } = useLiveSpeechPreview({
    language: 'en-US',
    continuous: true,
    interimResults: true,
  });

  const {
    status: processingStatus,
    progress: processingProgress,
    result: processedResult,
    error: processingError,
    isUsingFallback,
    processTranscript,
    reset: resetProcessor,
  } = useTranscriptProcessor();

  const processingStatusRef = React.useRef<ProcessingStatus>(processingStatus);
  React.useEffect(() => { processingStatusRef.current = processingStatus; }, [processingStatus]);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackProgress, setPlaybackProgress] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showProcessedView, setShowProcessedView] = React.useState(false);
  const [editedTranscript, setEditedTranscript] = React.useState('');
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);
  const audioTranscribedRef = React.useRef(false);
  const [isAudioTranscribing, setIsAudioTranscribing] = React.useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = React.useState<'idle' | 'transcribing' | 'failed' | 'succeeded'>('idle');
  const [transcriptionError, setTranscriptionError] = React.useState<string | null>(null);
  const [persistedAudioPath, setPersistedAudioPath] = React.useState<string | null>(null);
  const [persistedAudioMimeType, setPersistedAudioMimeType] = React.useState<string | null>(null);
  const [isPersistingAudio, setIsPersistingAudio] = React.useState(false);

  const persistAudioForRecovery = React.useCallback(async (blob: Blob, mimeType: string, duration: number) => {
    if (persistedAudioPath || isPersistingAudio) {
      return persistedAudioPath;
    }

    setIsPersistingAudio(true);
    try {
      const storagePath = await uploadAudio(blob, mimeType);
      if (!storagePath) {
        setTranscriptionError('Recorded audio could not be uploaded for recovery. Retry may not survive refresh.');
        captureMessage('Audio recovery upload failed', 'warning', { context: 'diary:audioPersist' });
        return null;
      }

      setPersistedAudioPath(storagePath);
      setPersistedAudioMimeType(mimeType);
      writeRecoveryState({
        storagePath,
        mimeType,
        durationSeconds: duration,
        savedAt: Date.now(),
      });
      return storagePath;
    } catch (err) {
      captureError(err, { context: 'diary:audioPersist' });
      return null;
    } finally {
      setIsPersistingAudio(false);
    }
  }, [isPersistingAudio, persistedAudioPath]);

  const transcribeAudioBlob = React.useCallback(async (blob: Blob, options?: { isRetry?: boolean }) => {
    setIsAudioTranscribing(true);
    setTranscriptionStatus('transcribing');
    setTranscriptionError(null);

    try {
      const mimeType = blob.type || persistedAudioMimeType || 'audio/webm';
      const ext = getExtFromMimeType(mimeType);
      const filename = `recording.${ext}`;
      const form = new FormData();
      form.append('audio', blob, filename);
      form.append('mimeType', mimeType);

      let response: Response;
      try {
        response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          body: form,
        });
      } catch (requestErr) {
        captureError(requestErr, { context: 'diary:audioTranscribe', operation: 'request-route', isRetry: options?.isRetry ?? false });
        setTranscriptionStatus('failed');
        setTranscriptionError('The transcription request could not reach the server. You can retry or type your transcript manually.');
        toast.error('Transcription request failed', {
          description: 'The transcription request could not reach the server. You can retry or type your transcript manually.',
        });
        return;
      }

      let data: TranscribeRouteResponse | null = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        captureError(parseErr, { context: 'diary:audioTranscribe', operation: 'parse-route-response', isRetry: options?.isRetry ?? false });
        setTranscriptionStatus('failed');
        setTranscriptionError('The server returned an unreadable transcription response. You can retry or type your transcript manually.');
        toast.error('Unreadable transcription response', {
          description: 'The server returned an unreadable transcription response. You can retry or type your transcript manually.',
        });
        return;
      }

      if (!response.ok) {
        const message = typeof data?.error === 'string' && data.error.trim().length > 0
          ? data.error
          : 'Could not transcribe audio. You can type your transcript manually.';

        setTranscriptionStatus('failed');
        setTranscriptionError(message);

        if (data?.missing_env) {
          captureMessage(data.error ?? 'Audio transcription unavailable', 'warning', {
            context: 'diary:audioTranscribe',
            missing_env: data.missing_env,
            isRetry: options?.isRetry ?? false,
          });
          toast.warning('Auto-transcription unavailable', {
            description: 'You can type your transcript manually below.',
          });
        } else {
          toast.error('Transcription failed', {
            description: message,
          });
        }
        return;
      }

      if (data?.success && data.transcript && data.transcript.trim().length > 0) {
        setTranscriptionStatus('succeeded');
        setTranscriptionError(null);
        setEditedTranscript(data.transcript);
        processTranscript(data.transcript);
        writeRecoveryState(null);
        trackBetaEvent({
          eventName: 'diary_processed',
          route: '/coach',
          tabName: 'diary',
          actionName: options?.isRetry ? 'audio_transcribed_retry' : 'audio_transcribed',
        });
        toast.success(options?.isRetry ? 'Transcription retried' : 'Audio transcribed', {
          description: options?.isRetry
            ? 'Transcript captured from your existing recording.'
            : 'Transcript captured from your recording.',
        });
      } else if (data?.errorCode === 'empty_transcript' || data?.success === false) {
        const message = typeof data?.error === 'string' && data.error.trim().length > 0
          ? data.error
          : 'The transcription service returned no text from this recording.';
        setTranscriptionStatus('failed');
        setTranscriptionError(message);
        toast.warning('No speech detected', {
          description: message,
        });
      }
    } catch (err) {
      captureError(err, { context: 'diary:audioTranscribe', isRetry: options?.isRetry ?? false });
      setTranscriptionStatus('failed');
      setTranscriptionError('The transcription request failed unexpectedly. You can retry or type your transcript manually.');
      toast.error('Transcription failed', {
        description: 'The transcription request failed unexpectedly. You can retry or type your transcript manually.',
      });
    } finally {
      setIsAudioTranscribing(false);
    }
  }, [persistedAudioMimeType, processTranscript]);

  const handleRetryTranscription = React.useCallback(async () => {
    if (isAudioTranscribing) return;

    if (audioBlob) {
      audioTranscribedRef.current = true;
      await transcribeAudioBlob(audioBlob, { isRetry: true });
      return;
    }

    if (!persistedAudioPath) return;

    const recoveredBlob = await downloadAudio(persistedAudioPath);
    if (!recoveredBlob) {
      setTranscriptionStatus('failed');
      setTranscriptionError('Saved audio could not be recovered for retry. You can type your transcript manually or re-record.');
      toast.error('Recovery failed', {
        description: 'Saved audio could not be recovered for retry. You can type your transcript manually or re-record.',
      });
      return;
    }

    audioTranscribedRef.current = true;
    await transcribeAudioBlob(recoveredBlob, { isRetry: true });
  }, [audioBlob, isAudioTranscribing, persistedAudioPath, transcribeAudioBlob]);

  React.useEffect(() => {
    const recovery = readRecoveryState();
    if (!recovery) return;

    setPersistedAudioPath(recovery.storagePath);
    setPersistedAudioMimeType(recovery.mimeType);
    setTranscriptionStatus('failed');
    setTranscriptionError('Recovered your previous recording. Retry transcription or type your transcript manually.');

    if (!audioUrl) {
      void getSignedAudioUrl(recovery.storagePath).then((url) => {
        if (url && audioRef.current) {
          audioRef.current.src = url;
        }
      });
    }
  }, [audioUrl]);

  React.useEffect(() => {
    if (recordingStatus === 'recording') {
      audioTranscribedRef.current = false;
      setTranscriptionStatus('idle');
      setTranscriptionError(null);
      setPersistedAudioPath(null);
      setPersistedAudioMimeType(null);
      writeRecoveryState(null);
    }
  }, [recordingStatus]);

  React.useEffect(() => {
    if (recordingStatus !== 'completed' || !audioBlob || audioTranscribedRef.current) return;

    audioTranscribedRef.current = true;
    const mimeType = audioBlob.type || 'audio/webm';

    void (async () => {
      await persistAudioForRecovery(audioBlob, mimeType, durationSeconds);
      await transcribeAudioBlob(audioBlob);
    })();
  }, [audioBlob, durationSeconds, persistAudioForRecovery, recordingStatus, transcribeAudioBlob]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleStartRecording = async () => {
    await trackBetaEvent({ eventName: 'diary_record_started', route: '/coach', tabName: 'diary', actionName: 'start_recording' });
    resetPreview();
    resetProcessor();
    setEditedTranscript('');
    setTranscriptionStatus('idle');
    setTranscriptionError(null);
    setIsEditingTranscript(false);
    setShowProcessedView(false);
    await startRecording();
    if (isSpeechSupported) {
      startPreview();
    }
  };

  const handlePauseRecording = () => {
    pauseRecording();
    pausePreview();
  };

  const handleResumeRecording = () => {
    resumeRecording();
    resumePreview();
  };

  const handleStop = async () => {
    stopPreview();
    await stopRecording();
  };

  const handleSave = async () => {
    let blobForSave = audioBlob;
    let urlForSave = audioUrl;

    if ((!blobForSave || !urlForSave) && persistedAudioPath) {
      const recoveredBlob = await downloadAudio(persistedAudioPath);
      const recoveredUrl = await getSignedAudioUrl(persistedAudioPath);
      if (recoveredBlob) blobForSave = recoveredBlob;
      if (recoveredUrl) urlForSave = recoveredUrl;
    }

    if (!blobForSave || !urlForSave) return;

    setIsSaving(true);

    if (processingStatus === 'processing') {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (processingStatusRef.current !== 'processing') {
            clearInterval(check);
            resolve();
          }
        }, 250);
      });
    }

    let finalBlob: Blob = blobForSave;
    let finalUrl: string = urlForSave;
    if (blobForSave.type.includes('webm') && durationSeconds > 0) {
      try {
        const fixed: Blob = await fixWebmDuration(blobForSave, durationSeconds * 1000, { logger: false });
        const fixedUrl = URL.createObjectURL(fixed);
        finalBlob = fixed;
        finalUrl = fixedUrl;
      } catch {
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    setIsSaving(false);

    try {
      onComplete({
        audioBlob: finalBlob,
        audioUrl: persistedAudioPath || finalUrl,
        duration: durationSeconds,
        mimeType: finalBlob.type,
        transcript: editedTranscript,
        cleanedTranscript: processedResult?.cleanedTranscript,
        summary: processedResult?.summary,
        keyTopics: processedResult?.keyTopics,
        mood: processedResult?.mood,
        actionItems: processedResult?.actionItems,
        prayerPoints: processedResult?.prayerPoints,
      });
      writeRecoveryState(null);
    } catch (err) {
      captureError(err, { context: 'diary:save' });
      toast.error('Failed to save entry', {
        description: 'Your recording is safe. Please try again.',
      });
    }
  };

  const handleDiscard = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    resetPreview();
    resetProcessor();
    setEditedTranscript('');
    setTranscriptionStatus('idle');
    setTranscriptionError(null);
    setPersistedAudioPath(null);
    setPersistedAudioMimeType(null);
    writeRecoveryState(null);
    setIsEditingTranscript(false);
    setShowProcessedView(false);
    discardRecording();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodEmoji = (mood: string): string => {
    const moodEmojis: Record<string, string> = {
      grateful: '🙏',
      hopeful: '🌟',
      peaceful: '☮️',
      joyful: '😊',
      reflective: '🤔',
      anxious: '😰',
      stressed: '😓',
      frustrated: '😤',
    };
    return moodEmojis[mood] || '📝';
  };

  const status = recordingStatus;

  const getWaveformBars = () => {
    if (status !== 'recording' && status !== 'paused') return [];
    return Array.from({ length: 32 }, (_, i) => {
      const height = recordingStatus === 'paused'
        ? 8
        : 8 + Math.sin(i * 0.5) * 12 + audioLevel * 40;
      return Math.min(48, Math.max(4, height));
    });
  };

  const getTranscriptStatus = (): { label: string; color: string; icon: React.ReactNode } => {
    if (speechError) {
      return { label: 'Error', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="h-3 w-3" /> };
    }
    if (!isSpeechSupported) {
      return { label: 'Not Supported', color: 'bg-muted text-muted-foreground', icon: <MicOff className="h-3 w-3" /> };
    }
    switch (previewStatus) {
      case 'listening':
        return { label: 'Listening', color: 'bg-success/20 text-success', icon: <Mic className="h-3 w-3 animate-pulse" /> };
      case 'paused':
        return { label: 'Paused', color: 'bg-warning/20 text-warning', icon: <Pause className="h-3 w-3" /> };
      case 'stopped':
        return { label: 'Complete', color: 'bg-success/20 text-success', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'failed':
        return { label: 'Error', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="h-3 w-3" /> };
      default:
        return { label: 'Ready', color: 'bg-muted text-muted-foreground', icon: <FileText className="h-3 w-3" /> };
    }
  };

  const transcriptStatus = getTranscriptStatus();
  const combinedError = recordingError || speechError;
  const liveTranscript = interimText;
  const transcriptBadgeLabel = editedTranscript
    ? 'Captured'
    : transcriptionStatus === 'transcribing'
      ? 'Transcribing…'
      : transcriptionStatus === 'failed'
        ? 'Failed'
        : 'Empty';

  return (
    <div className="space-y-6">
      {(audioUrl || persistedAudioPath) && (
        <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" />
      )}

      {combinedError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Recording Error</p>
            <p className="text-sm text-destructive/80 mt-0.5">{combinedError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {status === 'idle' && (
          <>
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mic className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to Record</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Share your thoughts, prayers, or reflections. AI will help summarize and extract insights.
            </p>
            <Button size="lg" className="gap-2 rounded-full px-8 h-12" onClick={handleStartRecording}>
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
            {!isSpeechSupported && (
              <p className="text-xs text-muted-foreground mt-4 max-w-sm">
                Live speech recognition is not available in this browser. Audio is still recorded and transcription may fall back after recording.
              </p>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" className="mt-4" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </>
        )}

        {(status === 'recording' || status === 'paused') && (
          <>
            <div className="relative mb-6">
              <div className={cn(
                'h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300',
                status === 'recording' ? 'bg-destructive/10 ring-8 ring-destructive/5' : 'bg-warning/10'
              )}>
                {status === 'recording' ? (
                  <Mic className="h-10 w-10 text-destructive animate-pulse" />
                ) : (
                  <Pause className="h-10 w-10 text-warning" />
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-mono font-semibold mb-2">{formatTime(durationSeconds)}</div>
              <Badge className={cn('text-xs', transcriptStatus.color)}>
                {transcriptStatus.icon}
                {transcriptStatus.label}
              </Badge>
            </div>

            <div className="h-12 flex items-center justify-center gap-1.5 mb-8 px-4 max-w-md w-full">
              {getWaveformBars().map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full transition-all duration-200',
                    status === 'recording' ? 'bg-destructive/60' : 'bg-warning/60'
                  )}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {isSpeechSupported && liveTranscript && (
              <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-muted/50 border max-h-32 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Live Transcript</span>
                </div>
                <p className="text-sm text-left leading-relaxed">
                  {liveTranscript || (
                    <span className="text-muted-foreground italic">Listening...</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {status === 'recording' ? (
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handlePauseRecording}>
                  <Pause className="h-5 w-5" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handleResumeRecording}>
                  <Play className="h-5 w-5 ml-0.5" />
                </Button>
              )}
              <Button variant="destructive" size="icon" className="h-16 w-16 rounded-full" onClick={handleStop}>
                <Square className="h-6 w-6 fill-current" />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handleDiscard}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {status === 'completed' && (audioUrl || persistedAudioPath) && (
          <>
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <h3 className="text-lg font-semibold mb-1">Recording Complete</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {formatTime(durationSeconds)} recorded
            </p>

            <div className="w-full max-w-sm space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shrink-0" onClick={togglePlayback}>
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <div className="flex-1">
                  <Progress value={playbackProgress} className="h-2" />
                  <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                    <span>{formatTime(Math.floor((playbackProgress / 100) * durationSeconds))}</span>
                    <span>{formatTime(durationSeconds)}</span>
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div className="w-full max-w-md mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Transcript</span>
                  <Badge className={cn('text-[10px]', transcriptStatus.color)}>
                    {transcriptStatus.icon}
                    {transcriptBadgeLabel}
                  </Badge>
                </div>
                {editedTranscript && !isEditingTranscript && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setIsEditingTranscript(true)}>
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                {isEditingTranscript && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setIsEditingTranscript(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-success" onClick={() => setIsEditingTranscript(false)}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {transcriptionStatus === 'transcribing' && !editedTranscript && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-3 flex items-start gap-3">
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-primary">Transcribing recording</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We&apos;re converting your audio to text before analysis starts.
                    </p>
                  </div>
                </div>
              )}

              {transcriptionStatus === 'failed' && !isEditingTranscript && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-3 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-destructive">Transcription failed</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      {transcriptionError ?? 'Could not transcribe audio. You can add your transcript manually.'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs gap-1"
                    onClick={() => void handleRetryTranscription()}
                    disabled={(!audioBlob && !persistedAudioPath) || isAudioTranscribing}
                  >
                    <RefreshCw className={cn('h-3 w-3', isAudioTranscribing && 'animate-spin')} />
                    Retry transcription
                  </Button>
                </div>
              )}

              {isEditingTranscript ? (
                <Textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  placeholder="Edit or add your transcript here..."
                  className="min-h-[120px] text-sm"
                  autoFocus
                />
              ) : (
                <div className="p-4 rounded-xl bg-muted/50 border min-h-[80px] max-h-40 overflow-y-auto">
                  {editedTranscript ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {editedTranscript}
                    </p>
                  ) : transcriptionStatus === 'transcribing' ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      Transcribing audio…
                    </span>
                  ) : transcriptionStatus === 'failed' ? (
                    <p className="text-sm text-muted-foreground italic">
                      Transcription did not return text. Add your transcript manually to continue.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {isSpeechSupported
                        ? 'No transcript captured. You can add one manually.'
                        : 'Live transcription not available. You can add a transcript manually.'}
                    </p>
                  )}
                </div>
              )}

              {!editedTranscript && transcriptionStatus !== 'transcribing' && (
                <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs" onClick={() => setIsEditingTranscript(true)}>
                  + Add transcript manually
                </Button>
              )}
            </div>

            {editedTranscript && (
              <div className="w-full max-w-md mb-6">
                {processingStatus === 'processing' && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {processingProgress < 30 && 'Connecting to AI...'}
                          {processingProgress >= 30 && processingProgress < 60 && 'Analyzing transcript...'}
                          {processingProgress >= 60 && processingProgress < 90 && 'Extracting insights...'}
                          {processingProgress >= 90 && 'Finalizing...'}
                        </p>
                        <p className="text-xs text-muted-foreground">AI-powered analysis</p>
                      </div>
                    </div>
                    <Progress value={processingProgress} className="h-1.5" />
                  </div>
                )}

                {processingStatus === 'error' && processingError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium">Analysis failed</p>
                      <p className="text-xs text-destructive/80 mt-0.5">{processingError}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs gap-1"
                      onClick={() => {
                        const t = editedTranscript;
                        if (t) {
                          captureMessage('User retried transcript processing after error', 'info', { context: 'diary:process' });
                          toast.info('Retrying analysis…');
                          processTranscript(t);
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                )}

                {processingStatus === 'timedOut' && (
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 mb-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-warning font-medium">Analysis timed out</p>
                      <p className="text-xs text-warning/80 mt-0.5">
                        The AI took too long. You can retry or save without analysis — your recording is safe.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs gap-1"
                      onClick={() => {
                        const t = editedTranscript;
                        if (t) {
                          captureMessage('User retried transcript processing after timeout', 'info', { context: 'diary:process' });
                          toast.info('Retrying analysis…');
                          processTranscript(t);
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                )}

                {processingStatus === 'completed' && processedResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Analysis</span>
                        {isUsingFallback ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Local
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            OpenAI
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowProcessedView(!showProcessedView)}
                      >
                        {showProcessedView ? 'Hide Details' : 'Show Details'}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">Summary</span>
                        {processedResult.mood && (
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {getMoodEmoji(processedResult.mood)} {processedResult.mood}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">
                        {processedResult.summary}
                      </p>
                    </div>

                    {showProcessedView && (
                      <>
                        {processedResult.keyTopics.length > 0 && (
                          <div className="p-3 rounded-xl bg-muted/50 border">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics</span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {processedResult.keyTopics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {processedResult.actionItems.length > 0 && (
                          <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                            <span className="text-xs font-medium text-success uppercase tracking-wider flex items-center gap-1.5">
                              <Target className="h-3 w-3" />
                              Action Items
                            </span>
                            <ul className="mt-2 space-y-1.5">
                              {processedResult.actionItems.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {processedResult.prayerPoints.length > 0 && (
                          <div className="p-3 rounded-xl bg-[hsl(var(--spiritual))]/5 border border-[hsl(var(--spiritual))]/20">
                            <span className="text-xs font-medium text-[hsl(var(--spiritual))] uppercase tracking-wider flex items-center gap-1.5">
                              <Heart className="h-3 w-3" />
                              Prayer Points
                            </span>
                            <ul className="mt-2 space-y-1.5">
                              {processedResult.prayerPoints.map((point, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-[hsl(var(--spiritual))]">•</span>
                                  <span className="italic">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {processedResult.coachingInsight && !isUsingFallback && (
                          <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                            <span className="text-xs font-medium text-accent uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" />
                              Coaching Insight
                            </span>
                            <p className="mt-2 text-sm italic leading-relaxed">
                              &quot;{processedResult.coachingInsight}&quot;
                            </p>
                          </div>
                        )}

                        {processedResult.scriptureReferences && processedResult.scriptureReferences.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <BookMarked className="h-3 w-3" />
                              Scripture References
                            </span>
                            <ScriptureList references={processedResult.scriptureReferences} />
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-muted/50 border">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cleaned Transcript</span>
                          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                            {processedResult.cleanedTranscript}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" className="gap-2 flex-1" onClick={handleDiscard}>
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
              <Button
                size="lg"
                className="gap-2 flex-1"
                onClick={handleSave}
                disabled={isSaving || (transcriptionStatus === 'transcribing' && !editedTranscript)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
