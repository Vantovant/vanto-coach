import { NextRequest, NextResponse } from 'next/server';
import { captureError, captureMessage } from '@/lib/monitoring';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_UPSTREAM_ERROR_BODY_LENGTH = 300;

function getExtFromMime(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

function trimUpstreamBody(value: string): string {
  return value.trim().slice(0, MAX_UPSTREAM_ERROR_BODY_LENGTH);
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
    return NextResponse.json(
      {
        success: false,
        error: 'The server could not read the transcription upload.',
        errorCode: 'form_parse_failed',
      },
      { status: 400 }
    );
  }

  const audioEntry = formData.get('audio');
  if (!audioEntry) {
    return NextResponse.json(
      {
        success: false,
        error: 'No recorded audio was sent for transcription.',
        errorCode: 'missing_audio',
      },
      { status: 400 }
    );
  }

  if (!(audioEntry instanceof Blob)) {
    return NextResponse.json(
      {
        success: false,
        error: 'The recorded audio payload was invalid for transcription.',
        errorCode: 'invalid_audio_payload',
      },
      { status: 400 }
    );
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
      const safeUpstreamBody = trimUpstreamBody(errText);
      captureMessage(`Whisper API error: ${whisperResponse.status}`, 'error', {
        context: 'api:transcribe',
        statusCode: whisperResponse.status,
        body: safeUpstreamBody,
        submittedMimeType: mimeType,
        filename,
        extension: ext,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'The transcription service rejected this audio for processing.',
          errorCode: 'upstream_rejected_audio',
          detail: {
            upstreamStatus: whisperResponse.status,
            upstreamBody: safeUpstreamBody,
            submittedMimeType: mimeType,
            filename,
            extension: ext,
          },
        },
        { status: 502 }
      );
    }

    let transcript = '';
    try {
      transcript = await whisperResponse.text();
    } catch (e) {
      captureError(e, { context: 'api:transcribe', operation: 'read-upstream-response' });
      return NextResponse.json(
        {
          success: false,
          error: 'The transcription service returned an unreadable response.',
          errorCode: 'upstream_parse_failed',
        },
        { status: 502 }
      );
    }

    const cleanedTranscript = transcript.trim();
    if (!cleanedTranscript) {
      return NextResponse.json(
        {
          success: false,
          error: 'The transcription service returned no text from this recording.',
          errorCode: 'empty_transcript',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, transcript: cleanedTranscript });
  } catch (err) {
    captureError(err, { context: 'api:transcribe', operation: 'whisper-fetch' });
    return NextResponse.json(
      {
        success: false,
        error: 'The transcription request could not reach the transcription service.',
        errorCode: 'upstream_unreachable',
      },
      { status: 502 }
    );
  }
}
