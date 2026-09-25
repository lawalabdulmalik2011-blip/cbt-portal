// src/lib/attempts.js
import { supabase } from './supabase';

// ============================================
// Get or create an attempt for a student
// ============================================
export async function getOrCreateAttempt(examId, studentId) {
  const { data: existing } = await supabase
    .from('attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('attempts')
    .insert({ exam_id: examId, student_id: studentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// Load exam + questions for the student
// ============================================
export async function loadExamForStudent(examId) {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      exam_questions (
        order_index,
        questions ( id, type, question_text, question_image_url, options, points )
      )
    `)
    .eq('id', examId)
    .single();
  if (error) throw error;

  let questions = (data.exam_questions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((eq) => eq.questions)
    .filter(Boolean);

  // Remove correct_answer from payload (student shouldn't see it!)
  questions = questions.map((q) => ({
    id: q.id,
    type: q.type,
    question_text: q.question_text,
    question_image_url: q.question_image_url,
    options: q.options,
    points: q.points,
  }));

  return { ...data, questions };
}

// ============================================
// Save a single answer (upsert)
// ============================================
export async function saveAnswer({ attemptId, questionId, answer, timeSpent = 0 }) {
  const { error } = await supabase.from('answers').upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      answer,
      time_spent_seconds: timeSpent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'attempt_id,question_id' }
  );
  if (error) throw error;
}

// ============================================
// Load previously saved answers for resume
// ============================================
export async function loadAnswers(attemptId) {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId);
  if (error) throw error;
  return data ?? [];
}

// ============================================
// Submit and grade via Edge Function
// ============================================
export async function submitAttempt(attemptId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('grade-attempt', {
    body: { attempt_id: attemptId },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let msg = error.message;
    try {
      if (error.context && typeof error.context.json === 'function') {
        const body = await error.context.json();
        msg = body?.error || msg;
      }
    } catch (_) {}
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// ============================================
// List all published exams visible to a student
// ============================================
export async function listAvailableExamsForStudent(studentId, classLevel) {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subjects ( name, color ),
      exam_questions ( count )
    `)
    .eq('status', 'published')
    .order('start_at', { ascending: true, nullsFirst: false });
  if (error) throw error;

  // Filter by target_classes client-side (simpler than complex SQL)
  const filtered = (data ?? []).filter((e) => {
    if (!e.target_classes || e.target_classes.length === 0) return true;
    return classLevel && e.target_classes.includes(classLevel);
  });

  // Get this student's attempts
  const { data: attempts } = await supabase
    .from('attempts')
    .select('*')
    .eq('student_id', studentId);

  const attemptsByExam = {};
  (attempts ?? []).forEach((a) => {
    attemptsByExam[a.exam_id] = a;
  });

  return filtered.map((e) => ({
    ...e,
    question_count: e.exam_questions?.[0]?.count ?? 0,
    attempt: attemptsByExam[e.id] ?? null,
  }));
}

// ============================================
// List student's own attempts with scores
// ============================================
export async function listMyResults(studentId) {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      *,
      exams ( title, subject_id, subjects ( name, color ) )
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================
// Teacher: get all attempts for an exam
// ============================================
export async function listExamAttempts(examId) {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      *,
      profiles:student_id ( full_name, exam_number, class_level )
    `)
    .eq('exam_id', examId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}