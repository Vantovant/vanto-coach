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
import { useSpeechRecognition, type SpeechRecognitionStatus } from '@/hooks/useSpeechRecognition';
import { useTranscriptProcessor, type ProcessedTranscript } from '@/hooks/useTranscriptProcessor';
import { ScriptureList } from '@/components/bible/ScriptureCard';

// Extended result type that includes transcript and AI processing
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

export function VoiceRecorder({ onComplete, onCancel }: VoiceRecorderProps) {
  const {
    status: recordingStatus,
    duration,
    audioLevel,
    audioUrl,
    audioBlob,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    requestPermission,
  } = useAudioRecorder();

  const {
    status: speechStatus,
    isSupported: isSpeechSupported,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
  } = useSpeechRecognition({
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

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackProgress, setPlaybackProgress] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showProcessedView, setShowProcessedView] = React.useState(false);

  // Transcript editing state
  const [editedTranscript, setEditedTranscript] = React.useState('');
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);

  // Sync edited transcript with recognition transcript when recording completes
  React.useEffect(() => {
    if (recordingStatus === 'completed' && transcript) {
      setEditedTranscript(transcript);
    }
  }, [recordingStatus, transcript]);

  // Auto-process transcript when recording completes
  React.useEffect(() => {
    if (recordingStatus === 'completed' && transcript && transcript.trim().length > 0) {
      processTranscript(transcript);
    }
  }, [recordingStatus, transcript, processTranscript]);

  // Handle audio playback events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
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

  // Combined start: audio recording + speech recognition
  const handleStartRecording = async () => {
    resetTranscript();
    resetProcessor();
    setEditedTranscript('');
    setIsEditingTranscript(false);
    setShowProcessedView(false);
    await startRecording();
    if (isSpeechSupported) {
      startListening();
    }
  };

  // Combined pause
  const handlePauseRecording = () => {
    pauseRecording();
    pauseListening();
  };

  // Combined resume
  const handleResumeRecording = () => {
    resumeRecording();
    resumeListening();
  };

  // Combined stop
  const handleStop = async () => {
    stopListening();
    const result = await stopRecording();
    // Result is stored in hook state
  };

  const handleSave = async () => {
    if (!audioBlob || !audioUrl) return;

    setIsSaving(true);

    // Wait for processing to complete if still in progress
    if (processingStatus === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsSaving(false);
    onComplete({
      audioBlob,
      audioUrl,
      duration,
      mimeType: audioBlob.type,
      transcript: editedTranscript || transcript,
      cleanedTranscript: processedResult?.cleanedTranscript,
      summary: processedResult?.summary,
      keyTopics: processedResult?.keyTopics,
      mood: processedResult?.mood,
      actionItems: processedResult?.actionItems,
      prayerPoints: processedResult?.prayerPoints,
    });
  };

  const handleDiscard = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    resetTranscript();
    resetProcessor();
    setEditedTranscript('');
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

  // Generate waveform bars based on audio level
  const generateWaveformBars = () => {
    const bars = 32;
    return Array.from({ length: bars }, (_, i) => {
      const baseHeight = 8;
      const variance = Math.sin((i / bars) * Math.PI) * 0.5 + 0.5;
      const levelFactor = audioLevel / 100;
      const randomFactor = 0.3 + Math.random() * 0.7;
      const height = baseHeight + (variance * levelFactor * randomFactor * 40);
      return Math.min(48, Math.max(4, height));
    });
  };

  // Get transcript status display
  const getTranscriptStatus = (): { label: string; color: string; icon: React.ReactNode } => {
    if (speechError) {
      return { label: 'Error', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="h-3 w-3" /> };
    }
    if (!isSpeechSupported) {
      return { label: 'Not Supported', color: 'bg-muted text-muted-foreground', icon: <MicOff className="h-3 w-3" /> };
    }
    switch (speechStatus) {
      case 'listening':
        return { label: 'Listening', color: 'bg-success/20 text-success', icon: <Mic className="h-3 w-3 animate-pulse" /> };
      case 'starting':
        return { label: 'Starting...', color: 'bg-warning/20 text-warning', icon: <Loader2 className="h-3 w-3 animate-spin" /> };
      case 'paused':
        return { label: 'Paused', color: 'bg-warning/20 text-warning', icon: <Pause className="h-3 w-3" /> };
      case 'stopped':
        return { label: 'Complete', color: 'bg-success/20 text-success', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'error':
        return { label: 'Error', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="h-3 w-3" /> };
      default:
        return { label: 'Ready', color: 'bg-muted text-muted-foreground', icon: <FileText className="h-3 w-3" /> };
    }
  };

  const transcriptStatus = getTranscriptStatus();
  const combinedError = recordingError || speechError;
  const status = recordingStatus;

  // Combined transcript for display (final + interim)
  const liveTranscript = interimTranscript
    ? `${transcript} ${interimTranscript}`.trim()
    : transcript;

  return (
    <div className="space-y-6">
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}

      {/* Error Message */}
      {combinedError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Recording Error</p>
            <p className="text-sm text-destructive/80 mt-0.5">{combinedError}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => status === 'permission-denied' ? requestPermission() : handleDiscard()}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Permission Denied State */}
      {status === 'permission-denied' && !combinedError && (
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-muted/50 border border-dashed">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <MicOff className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            To record voice entries, please allow microphone access in your browser settings.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={requestPermission} className="gap-2">
              <Settings className="h-4 w-4" />
              Check Permission
            </Button>
          </div>
        </div>
      )}

      {/* Requesting Permission State */}
      {status === 'requesting-permission' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Requesting microphone access...</p>
        </div>
      )}

      {/* Idle / Ready State */}
      {(status === 'idle' || status === 'ready') && !combinedError && (
        <div className="flex flex-col items-center justify-center py-8">
          <button
            onClick={handleStartRecording}
            className="group relative h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center transition-all hover:scale-105 hover:border-primary/40 hover:from-primary/30 hover:to-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg">
              <Mic className="h-10 w-10 text-primary-foreground" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          </button>
          <p className="text-sm text-muted-foreground mt-6">
            Tap to start recording
          </p>
          {!isSpeechSupported && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Live transcription not available in this browser
            </p>
          )}
        </div>
      )}

      {/* Recording / Paused State */}
      {(status === 'recording' || status === 'paused') && (
        <div className="flex flex-col items-center justify-center py-4">
          {/* Recording Indicator */}
          <div className="relative mb-6">
            <div className={cn(
              'h-32 w-32 rounded-full flex items-center justify-center transition-all',
              status === 'recording'
                ? 'bg-destructive/20 animate-pulse'
                : 'bg-warning/20'
            )}>
              <div className={cn(
                'h-24 w-24 rounded-full flex items-center justify-center transition-all',
                status === 'recording'
                  ? 'bg-destructive/30'
                  : 'bg-warning/30'
              )}>
                <div className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center transition-all',
                  status === 'recording'
                    ? 'bg-destructive'
                    : 'bg-warning'
                )}>
                  {status === 'recording' ? (
                    <Mic className="h-8 w-8 text-white animate-pulse" />
                  ) : (
                    <Pause className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Audio Level Ring */}
            {status === 'recording' && (
              <div
                className="absolute inset-0 rounded-full border-4 border-destructive/40 transition-transform"
                style={{
                  transform: `scale(${1 + (audioLevel / 150)})`,
                  opacity: 0.3 + (audioLevel / 200)
                }}
              />
            )}
          </div>

          {/* Duration Display */}
          <div className="text-5xl font-mono font-light mb-2 tracking-wider">
            {formatTime(duration)}
          </div>

          {/* Status Text */}
          <div className="flex items-center gap-2 mb-4">
            {status === 'recording' && (
              <>
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm text-muted-foreground">Recording...</span>
              </>
            )}
            {status === 'paused' && (
              <>
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Paused</span>
              </>
            )}
          </div>

          {/* Transcript Status Badge */}
          {isSpeechSupported && (
            <Badge className={cn('mb-4 gap-1.5', transcriptStatus.color)}>
              {transcriptStatus.icon}
              {transcriptStatus.label}
            </Badge>
          )}

          {/* Waveform Visualization */}
          <div className="flex items-center justify-center gap-[3px] h-12 mb-4 px-4">
            {generateWaveformBars().map((height, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 rounded-full transition-all duration-75',
                  status === 'recording' ? 'bg-destructive' : 'bg-warning'
                )}
                style={{
                  height: status === 'recording' ? `${height}px` : '4px',
                  opacity: status === 'recording' ? 0.6 + (height / 80) : 0.3
                }}
              />
            ))}
          </div>

          {/* Live Transcript Display */}
          {isSpeechSupported && (liveTranscript || interimTranscript) && (
            <div className="w-full max-w-md mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Live Transcript</span>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border max-h-32 overflow-y-auto">
                <p className="text-sm leading-relaxed">
                  {transcript && <span>{transcript} </span>}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">{interimTranscript}</span>
                  )}
                  {!transcript && !interimTranscript && (
                    <span className="text-muted-foreground italic">Listening...</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center gap-4">
            {status === 'recording' ? (
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handlePauseRecording}
              >
                <Pause className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleResumeRecording}
              >
                <Play className="h-6 w-6 ml-0.5" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg"
              onClick={handleStop}
            >
              <Square className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full text-muted-foreground hover:text-destructive"
              onClick={handleDiscard}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {status === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Processing recording...</p>
        </div>
      )}

      {/* Completed State with Playback */}
      {status === 'completed' && audioUrl && (
        <div className="flex flex-col items-center justify-center py-4">
          {/* Success Indicator */}
          <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>

          <h3 className="text-lg font-semibold mb-1">Recording Complete</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {formatTime(duration)} recorded
          </p>

          {/* Playback Controls */}
          <div className="w-full max-w-sm space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shrink-0"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <div className="flex-1">
                <Progress value={playbackProgress} className="h-2" />
                <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>{formatTime(Math.floor((playbackProgress / 100) * duration))}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          {/* Transcript Section */}
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transcript</span>
                <Badge className={cn('text-[10px]', transcriptStatus.color)}>
                  {transcriptStatus.icon}
                  {transcript ? 'Captured' : 'Empty'}
                </Badge>
              </div>
              {(transcript || editedTranscript) && !isEditingTranscript && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setIsEditingTranscript(true)}
                >
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
                      setEditedTranscript(transcript);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-success"
                    onClick={() => setIsEditingTranscript(false)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

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
                {editedTranscript || transcript ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {editedTranscript || transcript}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {isSpeechSupported
                      ? "No transcript captured. You can add one manually."
                      : "Live transcription not available. You can add a transcript manually."}
                  </p>
                )}
              </div>
            )}

            {!transcript && !editedTranscript && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0 text-xs"
                onClick={() => setIsEditingTranscript(true)}
              >
                + Add transcript manually
              </Button>
            )}
          </div>

          {/* AI Processing Section */}
          {(transcript || editedTranscript) && (
            <div className="w-full max-w-md mb-6">
              {/* Processing Status */}
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

              {/* Processing Error */}
              {processingStatus === 'error' && processingError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {processingError}
                  </p>
                </div>
              )}

              {/* Processed Results */}
              {processingStatus === 'completed' && processedResult && (
                <div className="space-y-4">
                  {/* Toggle View */}
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

                  {/* Summary Card */}
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
                      {/* Key Topics */}
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

                      {/* Action Items */}
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

                      {/* Prayer Points */}
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

                      {/* Coaching Insight (OpenAI only) */}
                      {processedResult.coachingInsight && !isUsingFallback && (
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                          <span className="text-xs font-medium text-accent uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" />
                            Coaching Insight
                          </span>
                          <p className="text-sm mt-2 leading-relaxed italic">
                            "{processedResult.coachingInsight}"
                          </p>
                        </div>
                      )}

                      {/* Scripture References */}
                      {processedResult.scriptureReferences && processedResult.scriptureReferences.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-accent uppercase tracking-wider flex items-center gap-1.5 px-1">
                            <BookMarked className="h-3 w-3" />
                            Scripture Referenced
                          </span>
                          <ScriptureList
                            references={processedResult.scriptureReferences}
                            compact
                            maxDisplay={3}
                          />
                        </div>
                      )}

                      {/* Cleaned Transcript */}
                      <div className="p-3 rounded-xl bg-muted/50 border">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cleaned Transcript</span>
                        <p className="text-sm mt-2 leading-relaxed text-muted-foreground">
                          {processedResult.cleanedTranscript}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={isSaving}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Discard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleDiscard();
                setTimeout(handleStartRecording, 100);
              }}
              disabled={isSaving}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-record
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 min-w-[120px]"
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
        </div>
      )}

      {/* Saving Progress */}
      {isSaving && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saving audio...</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saving transcript...</span>
            {(editedTranscript || transcript) ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <span className="text-xs text-muted-foreground">Skipped</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Generating insights...</span>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>
      )}

      {/* Tips (shown in idle state) */}
      {(status === 'idle' || status === 'ready') && !combinedError && (
        <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Speak freely about your day, thoughts, struggles, or gratitude.
            <br />
            Your words will be preserved, transcribed, and transformed into wisdom.
          </p>
        </div>
      )}
    </div>
  );
}
