// src/lib/exams.js
import { supabase } from './supabase';

export async function listExams({ status, subjectId } = {}) {
  let q = supabase
    .from('exams')
    .select(`
      *,
      subjects ( name, color ),
      exam_questions ( count )
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') q = q.eq('status', status);
  if (subjectId) q = q.eq('subject_id', subjectId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...e,
    question_count: e.exam_questions?.[0]?.count ?? 0,
  }));
}

export async function getExam(id) {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subjects ( name, color ),
      exam_questions (
        order_index,
        questions ( * )
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  const questions = (data.exam_questions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((eq) => eq.questions);

  return { ...data, questions };
}

export async function createExam(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('exams')
    .insert({ ...payload, created_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExam(id, updates) {
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

export async function setExamQuestions(examId, questionIds) {
  // Delete existing, insert new
  const { error: delErr } = await supabase
    .from('exam_questions')
    .delete()
    .eq('exam_id', examId);
  if (delErr) throw delErr;

  if (!questionIds.length) {
    await supabase.from('exams').update({ total_questions: 0 }).eq('id', examId);
    return;
  }

  const rows = questionIds.map((qid, i) => ({
    exam_id: examId,
    question_id: qid,
    order_index: i,
  }));

  const { error: insErr } = await supabase.from('exam_questions').insert(rows);
  if (insErr) throw insErr;

  await supabase
    .from('exams')
    .update({ total_questions: questionIds.length })
    .eq('id', examId);
}

// Publish = students can now see it
export async function publishExam(id) {
  return updateExam(id, { status: 'published' });
}

export async function closeExam(id) {
  return updateExam(id, { status: 'closed' });
}