import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG, AI_PROMPTS, type AIProcessingRequest, type AIProcessingResponse, type ProcessedTranscriptData } from '@/lib/ai/config';

// Check if OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest): Promise<NextResponse<AIProcessingResponse>> {
  try {
    const body: AIProcessingRequest = await request.json();
    const { transcript, options = {} } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No transcript provided',
      }, { status: 400 });
    }

    // If no API key, use fallback local processing
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using fallback processing');
      const fallbackResult = processTranscriptLocally(transcript);
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        fallbackUsed: true,
      });
    }

    // Call OpenAI API
    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: AI_PROMPTS.transcriptProcessor,
            },
            {
              role: 'user',
              content: `Process this voice diary transcript:\n\n"${transcript}"`,
            },
          ],
          temperature: AI_CONFIG.temperature.extraction,
          max_tokens: AI_CONFIG.maxTokens.extraction,
          response_format: { type: 'json_object' },
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);

        // Fall back to local processing on API error
        const fallbackResult = processTranscriptLocally(transcript);
        return NextResponse.json({
          success: true,
          data: fallbackResult,
          fallbackUsed: true,
        });
      }

      const data = await openAIResponse.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse the JSON response from OpenAI
      const parsed = JSON.parse(content);

      const processedData: ProcessedTranscriptData = {
        rawTranscript: transcript,
        cleanedTranscript: parsed.cleanedTranscript || transcript,
        summary: parsed.summary || 'Voice entry recorded.',
        mood: parsed.mood || null,
        moodConfidence: parsed.moodConfidence || 0.5,
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        prayerPoints: Array.isArray(parsed.prayerPoints) ? parsed.prayerPoints : [],
        scriptureReferences: Array.isArray(parsed.scriptureReferences) ? parsed.scriptureReferences : [],
        spiritualThemes: Array.isArray(parsed.spiritualThemes) ? parsed.spiritualThemes : [],
        coachingInsight: parsed.coachingInsight || undefined,
      };

      return NextResponse.json({
        success: true,
        data: processedData,
        fallbackUsed: false,
      });

    } catch (apiError) {
      console.error('OpenAI processing error:', apiError);

      // Fall back to local processing
      const fallbackResult = processTranscriptLocally(transcript);
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        fallbackUsed: true,
      });
    }

  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process transcript',
    }, { status: 500 });
  }
}

// ============================================
// FALLBACK LOCAL PROCESSING
// ============================================

// Filler words to remove
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'honestly', 'right', 'so yeah',
  'anyway', 'whatever', 'hmm', 'well', 'okay so', 'and um', 'but um',
];

// Mood keywords
const MOOD_KEYWORDS: Record<string, string[]> = {
  grateful: ['thankful', 'grateful', 'blessed', 'appreciate', 'gratitude', 'thank god', 'praise'],
  anxious: ['worried', 'anxious', 'nervous', 'stress', 'overwhelmed', 'panic', 'fear'],
  hopeful: ['hope', 'looking forward', 'excited', 'optimistic', 'opportunity', 'potential'],
  peaceful: ['peace', 'calm', 'rest', 'quiet', 'still', 'content', 'serene'],
  frustrated: ['frustrated', 'annoyed', 'irritated', 'angry', 'upset', 'disappointed'],
  reflective: ['thinking', 'reflecting', 'considering', 'pondering', 'wondering', 'realize'],
  joyful: ['joy', 'happy', 'delighted', 'wonderful', 'amazing', 'fantastic', 'great'],
  stressed: ['stressed', 'pressure', 'deadline', 'too much', 'busy', 'hectic', 'exhausted'],
};

// Action triggers
const ACTION_TRIGGERS = [
  'i need to', 'i should', 'i have to', 'i must', 'i will', "i'm going to",
  'remind me to', 'don\'t forget to', 'make sure to', 'want to', 'plan to',
  'going to try', 'need to remember', 'should probably',
];

// Prayer keywords
const PRAYER_KEYWORDS = [
  'pray', 'prayer', 'praying', 'lord', 'god', 'jesus', 'spirit',
  'intercede', 'petition', 'supplication', 'thank you lord', 'please god',
  'asking god', 'seeking', 'guidance', 'wisdom', 'strength', 'healing',
];

function processTranscriptLocally(raw: string): ProcessedTranscriptData {
  // Clean transcript
  let cleaned = raw.toLowerCase();
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b[,]?\\s*`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  cleaned = cleaned.replace(/\bi\b/g, 'I');
  cleaned = cleaned.replace(/\b(god|jesus|lord|christ|holy spirit|bible)\b/gi, (match) =>
    match.charAt(0).toUpperCase() + match.slice(1)
  );
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  // Generate summary
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let summary = sentences.length > 0
    ? sentences.slice(0, 2).join('. ').trim() + '.'
    : 'Voice entry recorded.';
  if (summary.length > 200) {
    summary = summary.slice(0, 197) + '...';
  }

  // Detect mood
  const lower = raw.toLowerCase();
  let detectedMood: string | null = null;
  let maxScore = 0;
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedMood = mood;
    }
  }

  // Extract topics
  const lifeAreas = [
    'family', 'marriage', 'children', 'parenting', 'work', 'career', 'job',
    'business', 'finances', 'money', 'health', 'fitness', 'relationships',
    'friendship', 'church', 'ministry', 'faith', 'spiritual', 'growth',
    'leadership', 'goals', 'dreams', 'future', 'past', 'healing',
  ];
  const keyTopics = lifeAreas
    .filter(area => lower.includes(area))
    .map(t => t.charAt(0).toUpperCase() + t.slice(1))
    .slice(0, 5);

  // Extract action items
  const actionItems: string[] = [];
  const sentenceList = raw.split(/[.!?]+/);
  for (const sentence of sentenceList) {
    const sentLower = sentence.toLowerCase().trim();
    for (const trigger of ACTION_TRIGGERS) {
      if (sentLower.includes(trigger)) {
        const idx = sentLower.indexOf(trigger);
        let action = sentence.slice(idx).trim();
        action = action.charAt(0).toUpperCase() + action.slice(1);
        if (action.length > 10 && action.length < 100) {
          actionItems.push(action.endsWith('.') ? action : action + '.');
        }
        break;
      }
    }
  }

  // Extract prayer points
  const prayerPoints: string[] = [];
  for (const sentence of sentenceList) {
    const sentLower = sentence.toLowerCase().trim();
    const hasPrayerContent = PRAYER_KEYWORDS.some(kw => sentLower.includes(kw));
    if (hasPrayerContent && sentence.trim().length > 15) {
      let prayer = sentence.trim();
      prayer = prayer.charAt(0).toUpperCase() + prayer.slice(1);
      prayerPoints.push(prayer.endsWith('.') ? prayer : prayer + '.');
    }
  }

  return {
    rawTranscript: raw,
    cleanedTranscript: cleaned,
    summary,
    mood: detectedMood || 'reflective',
    moodConfidence: maxScore > 0 ? Math.min(0.9, 0.5 + maxScore * 0.1) : 0.5,
    keyTopics,
    actionItems: actionItems.slice(0, 5),
    prayerPoints: prayerPoints.slice(0, 3),
    scriptureReferences: [],
    spiritualThemes: prayerPoints.length > 0 ? ['prayer'] : [],
    coachingInsight: undefined,
  };
}
