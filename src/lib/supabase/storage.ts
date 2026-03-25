/**
 * Vanto Coach — Audio Storage Service
 *
 * Handles uploading audio blobs to Supabase Storage
 * and generating signed URLs for playback.
 */

import { createClient } from './client';
import { captureMessage } from '@/lib/monitoring';

const BUCKET = 'coach-audio';

/**
 * Upload an audio blob to Supabase Storage.
 * Returns the storage path (not the public URL).
 */
export async function uploadAudio(
  blob: Blob,
  mimeType: string
): Promise<string | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    captureMessage('uploadAudio: no authenticated user', 'error', {
      context: 'storage:uploadAudio',
    });
    return null;
  }

  const ext = mimeType.includes('webm') ? 'webm'
    : mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
    : 'webm';

  const timestamp = Date.now();
  const path = `${user.id}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    captureMessage(`uploadAudio failed: ${error.message}`, 'error', {
      context: 'storage:uploadAudio',
      userId: user.id,
      storagePath: path,
    });
    return null;
  }

  return path;
}

/**
 * Generate a signed URL for an audio file (valid for 1 hour).
 */
export async function getSignedAudioUrl(path: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data) {
    captureMessage(`getSignedAudioUrl failed: ${error?.message ?? 'no data'}`, 'warning', {
      context: 'storage:getSignedAudioUrl',
      storagePath: path,
    });
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete an audio file from storage.
 */
export async function deleteAudio(path: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    captureMessage(`deleteAudio failed: ${error.message}`, 'error', {
      context: 'storage:deleteAudio',
      storagePath: path,
    });
    return false;
  }

  return true;
}
