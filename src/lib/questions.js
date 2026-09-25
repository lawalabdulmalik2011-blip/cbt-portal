// src/lib/questions.js
import { supabase } from './supabase';

// ============================================
// SUBJECTS
// ============================================
export async function listSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, question_count:questions(count)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((s) => ({
    ...s,
    question_count: s.question_count?.[0]?.count ?? 0,
  }));
}

export async function createSubject({ name, code, color }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name: name.trim(),
      code: code?.trim().toUpperCase() || null,
      color: color || '#6366f1',
      created_by: session.user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// QUESTIONS
// ============================================
export async function listQuestions({ subjectId, type, search, topic }) {
  let query = supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (type && type !== 'all') query = query.eq('type', type);
  if (topic) query = query.ilike('topic', `%${topic}%`);
  if (search) query = query.ilike('question_text', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getQuestion(id) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createQuestion(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('questions')
    .insert({ ...payload, created_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, updates) {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// IMAGE UPLOAD (Supabase Storage)
// ============================================
export async function uploadQuestionImage(file) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB');
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('question-images')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage
    .from('question-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteQuestionImage(publicUrl) {
  if (!publicUrl) return;
  // Extract path after the bucket name
  const marker = '/question-images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage
    .from('question-images')
    .remove([path]);
  if (error) console.error('Image delete failed:', error);
}

// ============================================
// BULK CSV IMPORT
// ============================================
// Expected CSV columns:
//   type, question_text, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, explanation
export async function bulkImportQuestions(subjectId, rows) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const payload = rows.map((r) => {
    const type = (r.type || 'mcq').toLowerCase();
    let options = null;
    let correct_answer = r.correct_answer || '';

    if (type === 'mcq') {
      options = [
        r.option_a && { key: 'A', text: r.option_a },
        r.option_b && { key: 'B', text: r.option_b },
        r.option_c && { key: 'C', text: r.option_c },
        r.option_d && { key: 'D', text: r.option_d },
      ].filter(Boolean);
      correct_answer = (r.correct_answer || '').toUpperCase().trim();
    } else if (type === 'true_false') {
      correct_answer = (r.correct_answer || '').toLowerCase().trim(); // 'true' | 'false'
    }

    return {
      subject_id: subjectId,
      type,
      question_text: r.question_text,
      options,
      correct_answer,
      explanation: r.explanation || null,
      topic: r.topic || null,
      difficulty: parseInt(r.difficulty || '3', 10),
      created_by: session.user.id,
    };
  });

  const { data, error } = await supabase
    .from('questions')
    .insert(payload)
    .select('id');

  if (error) throw error;
  return data;
}

// ============================================
// SAMPLE CSV TEMPLATE
// ============================================
export const QUESTION_CSV_TEMPLATE = `type,question_text,option_a,option_b,option_c,option_d,correct_answer,topic,difficulty,explanation
mcq,What is 2 + 2?,3,4,5,6,B,Arithmetic,1,Basic addition
mcq,What is the capital of Nigeria?,Lagos,Abuja,Kano,Ibadan,B,Geography,2,Abuja became capital in 1991
true_false,The Earth is flat.,,,,false,General Knowledge,1,The Earth is spherical
mcq,Solve: x + 5 = 12,,,,,7,Algebra,2,Subtract 5 from both sides`;