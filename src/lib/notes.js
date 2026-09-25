// src/lib/notes.js
import { supabase } from './supabase';

// ============================================
// LIST NOTES
// ============================================
export async function listNotes({ type, subjectId, classLevel } = {}) {
  let q = supabase
    .from('notes')
    .select(`
      *,
      subjects ( name, color )
    `)
    .order('created_at', { ascending: false });

  if (type && type !== 'all') q = q.eq('type', type);
  if (subjectId) q = q.eq('subject_id', subjectId);

  const { data, error } = await q;
  if (error) {
    console.error('listNotes error:', error);
    throw error;
  }

  // Filter by class (client-side, simple)
  let result = data ?? [];
  if (classLevel) {
    result = result.filter(
      (n) =>
        !n.target_classes ||
        n.target_classes.length === 0 ||
        n.target_classes.includes(classLevel)
    );
  }
  return result;
}

export async function getNote(id) {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects ( name, color )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createNote(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({ ...payload, created_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(id, updates) {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// SUBMISSIONS
// ============================================
export async function submitNote({ noteId, content }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('note_submissions')
    .upsert(
      {
        note_id: noteId,
        student_id: session.user.id,
        content,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'note_id,student_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMySubmission(noteId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('note_submissions')
    .select('*')
    .eq('note_id', noteId)
    .eq('student_id', session.user.id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function listSubmissions(noteId) {
  const { data, error } = await supabase
    .from('note_submissions')
    .select(`
      *,
      profile:student_id ( full_name, exam_number, class_level, photo_url )
    `)
    .eq('note_id', noteId)
    .order('submitted_at', { ascending: false });

  if (error) {
    // Fallback: fetch without join if relationship is broken
    console.error('listSubmissions join failed, using fallback:', error);
    const { data: raw, error: rawErr } = await supabase
      .from('note_submissions')
      .select('*')
      .eq('note_id', noteId)
      .order('submitted_at', { ascending: false });
    if (rawErr) throw rawErr;

    // Fetch profiles separately
    const studentIds = [...new Set((raw ?? []).map((s) => s.student_id))];
    let profileMap = {};
    if (studentIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, exam_number, class_level, photo_url')
        .in('id', studentIds);
      (profiles ?? []).forEach((p) => {
        profileMap[p.id] = p;
      });
    }

    return (raw ?? []).map((s) => ({
      ...s,
      profile: profileMap[s.student_id] ?? null,
    }));
  }

  return data ?? [];
}

export async function gradeSubmission(id, score, feedback) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('note_submissions')
    .update({
      score,
      feedback,
      graded_by: session.user.id,
      graded_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// STATS
// ============================================
export async function getNotesSummary(userId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { pending: 0, done: 0, total: 0 };

  const { data: notes } = await supabase
    .from('notes')
    .select('id, type');

  const { data: subs } = await supabase
    .from('note_submissions')
    .select('note_id')
    .eq('student_id', session.user.id);

  const submitted = new Set((subs ?? []).map((s) => s.note_id));
  const all = notes ?? [];
  const assignments = all.filter((n) => n.type === 'assignment');

  return {
    total: all.length,
    pending: all.filter((n) => !submitted.has(n.id)).length,
    assignments: assignments.length,
    assignmentsPending: assignments.filter((n) => !submitted.has(n.id)).length,
  };
}