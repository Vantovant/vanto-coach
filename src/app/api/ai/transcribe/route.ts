import { NextRequest, NextResponse } from 'next/server';
import { captureError, captureMessage } from '@/lib/monitoring';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** Map browser MIME type to a file extension Whisper API accepts. */
function getExtFromMime(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm'; // audio/webm;codecs=opus (Android Chrome) and fallback
}

/**
 * POST /api/ai/transcribe
 *
 * Accepts a multipart/form-data request with:
 *   audio    — the raw audio Blob from MediaRecorder
 *   mimeType — (optional) MIME string to derive the file extension
 *
 * Forwards the file to OpenAI Whisper-1 and returns:
 *   { success: true, transcript: string }
 *   { success: false, error: string, missing_env?: string }
 *
 * If OPENAI_API_KEY is not set, returns 503 with missing_env so
 * the caller can degrade gracefully without crashing.
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'OPENAI_API_KEY not configured — audio transcription unavailable',
        missing_env: 'OPENAI_API_KEY',
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    captureError(e, { context: 'api:transcribe', operation: 'parse-form' });
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
  }

  const audioEntry = formData.get('audio');
  if (!audioEntry || !(audioEntry instanceof Blob)) {
    return NextResponse.json({ success: false, error: 'No audio blob provided' }, { status: 400 });
  }

  // Prefer explicit mimeType field; fall back to Blob.type; then default to webm
  const mimeType =
    (formData.get('mimeType') as string | null) ||
    audioEntry.type ||
    'audio/webm';

  const ext = getExtFromMime(mimeType);
  const filename = `recording.${ext}`;

  // Whisper API requires a File with an extension in the filename
  const audioFile = new File([audioEntry], filename, { type: mimeType });

  const whisperForm = new FormData();
  whisperForm.append('file', audioFile, filename);
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('response_format', 'text');
  whisperForm.append('language', 'en');

  try {
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text().catch(() => '');
      captureMessage(`Whisper API error: ${whisperResponse.status}`, 'error', {
        context: 'api:transcribe',
        statusCode: whisperResponse.status,
        body: errText.slice(0, 200),
      });
      return NextResponse.json(
        { success: false, error: `Whisper API error: ${whisperResponse.status}` },
        { status: 500 }
      );
    }

    const transcript = await whisperResponse.text();
    return NextResponse.json({ success: true, transcript: transcript.trim() });
  } catch (err) {
    captureError(err, { context: 'api:transcribe', operation: 'whisper-fetch' });
    const message = err instanceof Error ? err.message : 'Whisper request failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
