// src/lib/admin.js
import { supabase } from './supabase';

export function examNumberToEmail(examNumber) {
  const slug = examNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}@exampro.local`;
}

export async function nextExamNumber(role = 'student') {
  const prefix = { student: 'STU', teacher: 'TCH', admin: 'ADM' }[role] ?? 'STU';
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from('profiles')
    .select('exam_number')
    .eq('role', role)
    .like('exam_number', `${prefix}/${year}/%`);

  if (error) {
    console.error('nextExamNumber error:', error);
    return `${prefix}/${year}/001`;
  }

  const next = (data?.length ?? 0) + 1;
  return `${prefix}/${year}/${String(next).padStart(3, '0')}`;
}

export function generatePassword(length = 10) {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  const chars = [
    lower[bytes[0] % lower.length],
    upper[bytes[1] % upper.length],
    digits[bytes[2] % digits.length],
  ];
  for (let i = 3; i < length; i++) {
    chars.push(all[bytes[i] % all.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ============================================
// Internal helper — invoke an Edge Function with explicit JWT
// ============================================
async function invokeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session. Please sign out and sign in again.');
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let realMessage = error.message || 'Edge Function error';
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errBody = await error.context.json();
        console.error(`❌ ${name} error body:`, errBody);
        if (errBody?.error) realMessage = errBody.error;
      }
    } catch (_) {}
    throw new Error(realMessage);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

// ============================================
// Edge Function wrappers
// ============================================
export async function createUser({
  exam_number,
  full_name,
  password,
  role,
  class_level,
  subject_specialty,
}) {
  return invokeFunction('admin-create-user', {
    exam_number,
    full_name,
    password: password || undefined,
    role,
    class_level: class_level || undefined,
    subject_specialty: subject_specialty || undefined,
  });
}

export async function deleteUser(userId) {
  return invokeFunction('admin-delete-user', { user_id: userId });
}

export async function resetUserPassword(userId, newPassword) {
  return invokeFunction('admin-reset-password', {
    user_id: userId,
    new_password: newPassword,
  });
}

// ============================================
// Direct DB operations (RLS-protected)
// ============================================
export async function listUsers({ role, search } = {}) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,exam_number.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function setUserActive(userId, isActive) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (error) throw error;
}