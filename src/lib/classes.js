// src/lib/classes.js
import { supabase } from './supabase';

export async function listClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('level')
    .order('section');
  if (error) throw error;
  return data ?? [];
}

export async function createClass({ name, level, section, capacity }) {
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, level, section, capacity })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClass(id, updates) {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

export async function getClassStats() {
  const { data: classes, error: cErr } = await supabase
    .from('classes')
    .select('*');
  if (cErr) throw cErr;

  const { data: students, error: sErr } = await supabase
    .from('profiles')
    .select('class_level')
    .eq('role', 'student');
  if (sErr) throw sErr;

  const counts = {};
  (students ?? []).forEach((s) => {
    if (s.class_level) {
      counts[s.class_level] = (counts[s.class_level] ?? 0) + 1;
    }
  });

  return (classes ?? []).map((c) => ({
    ...c,
    student_count: counts[c.name] ?? 0,
  }));
}

export async function listStudentsInClass(className) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('class_level', className)
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function assignStudentToClass(studentId, className) {
  const { error } = await supabase
    .from('profiles')
    .update({ class_level: className })
    .eq('id', studentId);
  if (error) throw error;
}

export async function bulkPromote({ from, to }) {
  const { data, error } = await supabase.rpc('promote_class', {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data;
}

// ============================================
// TEACHER ASSIGNMENTS
// ============================================
export async function listClassTeachers(classId) {
  const { data, error } = await supabase
    .from('class_teachers')
    .select(`
      id, teacher_id, subject_id,
      subjects ( id, name, color )
    `)
    .eq('class_id', classId);
  if (error) {
    // Fallback without join
    const { data: raw, error: rawErr } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('class_id', classId);
    if (rawErr) throw rawErr;

    const subIds = [...new Set((raw ?? []).map((r) => r.subject_id).filter(Boolean))];
    let subjectMap = {};
    if (subIds.length) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name, color')
        .in('id', subIds);
      (subjects ?? []).forEach((s) => {
        subjectMap[s.id] = s;
      });
    }

    return (raw ?? []).map((r) => ({
      ...r,
      subjects: subjectMap[r.subject_id] ?? null,
    }));
  }
  return data ?? [];
}

export async function assignTeacherToClass({ classId, teacherId, subjectId }) {
  const { data, error } = await supabase
    .from('class_teachers')
    .insert({
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeClassTeacher(id) {
  const { error } = await supabase.from('class_teachers').delete().eq('id', id);
  if (error) throw error;
}