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
// Helper — smart class matching
// ============================================
function matchesClass(studentClass, targetClasses) {
  if (!targetClasses || targetClasses.length === 0) return true;
  if (!studentClass) return false;

  const student = String(studentClass).toUpperCase().replace(/[^A-Z0-9]/g, '');

  return targetClasses.some((tc) => {
    const target = String(tc).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (student === target) return true;
    const studentBase = student.replace(/[A-Z]+$/, '');
    if (studentBase && studentBase === target) return true;
    if (student.startsWith(target)) return true;
    return false;
  });
}

// ============================================
// List all published exams visible to a student
// ============================================
export async function listAvailableExamsForStudent(studentId, classLevel) {
  // 1. Fetch published exams with subject details
  const { data: examsData, error: examsError } = await supabase
    .from('exams')
    .select(`
      *,
      subjects ( name, color )
    `)
    .eq('status', 'published')
    .order('start_at', { ascending: true, nullsFirst: false });

  if (examsError) {
    console.error("Error fetching exams:", examsError);
    throw examsError;
  }

  // 2. Filter by class using the helper
  const filteredExams = (examsData ?? []).filter((e) =>
    matchesClass(classLevel, e.target_classes)
  );

  // 3. Fetch question counts manually to avoid complex join issues
  const examIds = filteredExams.map((e) => e.id);
  let questionCounts = {};
  
  if (examIds.length > 0) {
    const { data: questionsData } = await supabase
      .from('exam_questions')
      .select('exam_id')
      .in('exam_id', examIds);
      
    if (questionsData) {
      questionsData.forEach((q) => {
        questionCounts[q.exam_id] = (questionCounts[q.exam_id] || 0) + 1;
      });
    }
  }

  // 4. Fetch this student's attempts
  const { data: attemptsData } = await supabase
    .from('attempts')
    .select('*')
    .eq('student_id', studentId);

  const attemptsByExam = {};
  (attemptsData ?? []).forEach((a) => {
    attemptsByExam[a.exam_id] = a;
  });

  // 5. Combine everything
  return filteredExams.map((e) => ({
    ...e,
    question_count: questionCounts[e.id] || 0,
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