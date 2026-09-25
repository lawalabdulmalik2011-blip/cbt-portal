// src/lib/studentAdmin.js
import { supabase } from './supabase';

export async function searchStudents({ query, classLevel, limit = 50 } = {}) {
  let q = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name')
    .limit(limit);

  if (classLevel) q = q.eq('class_level', classLevel);

  if (query && query.trim()) {
    const term = query.trim();
    q = q.or(`full_name.ilike.%${term}%,exam_number.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getStudentProfile(studentId) {
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();
  if (profErr) throw profErr;
  if (!profile) throw new Error('Student not found');

  const { data: attempts, error: attErr } = await supabase
    .from('attempts')
    .select(`
      *,
      exams ( id, title, pass_mark, duration_minutes, subject_id, subjects ( name, color ) )
    `)
    .eq('student_id', studentId)
    .order('started_at', { ascending: false });
  if (attErr) throw attErr;

  return { profile, attempts: attempts ?? [] };
}

export async function reopenAttempt(attemptId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  await supabase.from('answers').delete().eq('attempt_id', attemptId);

  const { data: att } = await supabase
    .from('attempts')
    .select('reset_count')
    .eq('id', attemptId)
    .maybeSingle();

  const { error: updErr } = await supabase
    .from('attempts')
    .update({
      status: 'in_progress',
      submitted_at: null,
      score: null,
      total_points: null,
      passed: null,
      violations: 0,
      violation_reason: null,
      is_flagged: false,
      current_question_index: 0,
      started_at: new Date().toISOString(),
      reset_count: (att?.reset_count ?? 0) + 1,
      last_reset_at: new Date().toISOString(),
      last_reset_by: session.user.id,
    })
    .eq('id', attemptId);
  if (updErr) throw updErr;

  await supabase.from('proctor_logs').delete().eq('attempt_id', attemptId);
  return { success: true };
}

export async function deleteAttempt(attemptId) {
  const { error } = await supabase
    .from('attempts')
    .delete()
    .eq('id', attemptId);
  if (error) throw error;
}

export async function getProctorLogs(attemptId) {
  const { data, error } = await supabase
    .from('proctor_logs')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}