// src/lib/photos.js
import { supabase } from './supabase';

/**
 * Upload a student photo to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadStudentPhoto(file, studentId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('Image must be under 3 MB');
  }

  const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
  const fileName = `${studentId}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('student-photos')
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage
    .from('student-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Delete a student photo by its public URL.
 */
export async function deleteStudentPhoto(publicUrl) {
  if (!publicUrl) return;
  const marker = '/student-photos/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  await supabase.storage.from('student-photos').remove([path]);
}