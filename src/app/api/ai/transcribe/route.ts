import { NextRequest, NextResponse } from 'next/server';
import { captureError, captureMessage } from '@/lib/monitoring';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getExtFromMime(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'Audio transcription is unavailable right now. You can type your transcript manually.',
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

  const mimeType =
    (formData.get('mimeType') as string | null) ||
    audioEntry.type ||
    'audio/webm';

  const ext = getExtFromMime(mimeType);
  const filename = `recording.${ext}`;
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
        {
          success: false,
          error: 'Audio transcription failed before text was returned. You can type your transcript manually and continue.',
        },
        { status: 500 }
      );
    }

    const transcript = await whisperResponse.text();
    return NextResponse.json({ success: true, transcript: transcript.trim() });
  } catch (err) {
    captureError(err, { context: 'api:transcribe', operation: 'whisper-fetch' });
    return NextResponse.json(
      {
        success: false,
        error: 'Could not reach the transcription service. You can type your transcript manually and continue.',
      },
      { status: 500 }
    );
  }
}
