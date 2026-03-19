// AI Service Configuration
// This module provides configuration for AI-powered features in Vanto Coach

export const AI_CONFIG = {
  // Model to use for transcript processing
  model: 'gpt-4o-mini' as const,

  // Temperature settings for different tasks
  temperature: {
    cleaning: 0.3,      // Low for consistent cleaning
    summary: 0.5,       // Medium for creative but accurate summaries
    extraction: 0.2,    // Low for reliable extraction
    coaching: 0.7,      // Higher for pastoral/coaching responses
  },

  // Max tokens for different operations
  maxTokens: {
    cleaning: 2000,
    summary: 500,
    extraction: 1500,
    coaching: 1000,
  },

  // API endpoint
  apiEndpoint: '/api/ai/process-transcript',
} as const;

// Types for AI processing
export interface AIProcessingRequest {
  transcript: string;
  options?: {
    generateSummary?: boolean;
    extractActions?: boolean;
    extractPrayers?: boolean;
    detectMood?: boolean;
    cleanTranscript?: boolean;
  };
}

export interface AIProcessingResponse {
  success: boolean;
  data?: ProcessedTranscriptData;
  error?: string;
  fallbackUsed?: boolean;
}

export interface ProcessedTranscriptData {
  rawTranscript: string;
  cleanedTranscript: string;
  summary: string;
  mood: string | null;
  moodConfidence: number;
  keyTopics: string[];
  actionItems: string[];
  prayerPoints: string[];
  scriptureReferences: string[];
  spiritualThemes: string[];
  coachingInsight?: string;
}

// System prompts for different AI tasks
export const AI_PROMPTS = {
  transcriptProcessor: `You are an AI assistant for Vanto Coach, an executive Christian life coaching application. Your role is to process voice diary transcripts and extract meaningful insights.

You will receive a raw transcript from a voice recording. Analyze it and return a JSON response with the following structure:

{
  "cleanedTranscript": "The transcript with filler words (um, uh, like, you know) removed, proper punctuation and capitalization added, and grammar corrected while preserving the speaker's voice and meaning.",
  "summary": "A 1-3 sentence summary capturing the key themes and emotional tone of the entry.",
  "mood": "One of: grateful, hopeful, peaceful, joyful, reflective, anxious, stressed, confused, grieving, frustrated, discouraged, overwhelmed, determined, convicted, neutral",
  "moodConfidence": 0.0-1.0,
  "keyTopics": ["Array of life areas mentioned: faith, family, marriage, parenting, health, business, career, finances, relationships, ministry, leadership, personal growth, rest, calling"],
  "actionItems": ["Array of tasks or intentions the speaker mentioned wanting to do, in format 'I need to...' or 'I should...'"],
  "prayerPoints": ["Array of prayer requests or spiritual concerns mentioned"],
  "scriptureReferences": ["Array of any Bible verses or books mentioned"],
  "spiritualThemes": ["Array of spiritual themes: prayer, worship, faith, trust, guidance, wisdom, healing, forgiveness, gratitude, etc."],
  "coachingInsight": "A brief, encouraging coaching insight or reflection question based on the content (1-2 sentences, warm and pastoral tone)"
}

Guidelines:
- Preserve the speaker's authentic voice in the cleaned transcript
- Be sensitive to spiritual and emotional content
- Extract actionable items that the speaker expressed intention to do
- Identify prayer needs with pastoral sensitivity
- Keep the coaching insight encouraging but grounded
- If content is unclear or minimal, provide appropriate minimal responses
- Always return valid JSON`,

  coachingResponse: `You are a compassionate Christian life coach providing wisdom and encouragement.
Your responses should be:
- Grounded in biblical principles
- Warm and pastoral in tone
- Practical and actionable
- Sensitive to the person's emotional state
- Encouraging without being dismissive of struggles

Provide coaching that honors both professional excellence and spiritual growth.`,
} as const;

// Mood to sentiment score mapping
export const MOOD_SENTIMENTS: Record<string, number> = {
  grateful: 0.9,
  hopeful: 0.8,
  peaceful: 0.85,
  joyful: 0.95,
  reflective: 0.6,
  determined: 0.75,
  convicted: 0.65,
  neutral: 0.5,
  confused: 0.4,
  anxious: 0.3,
  frustrated: 0.3,
  stressed: 0.25,
  discouraged: 0.25,
  overwhelmed: 0.2,
  grieving: 0.2,
};
