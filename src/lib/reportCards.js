// src/lib/reportCards.js
import { supabase } from './supabase';

// ============================================
// GRADE UTILITIES (WAEC scale)
// ============================================
export const GRADE_SCALE = [
  { grade: 'A1', min: 75, remark: 'Excellent' },
  { grade: 'B2', min: 70, remark: 'Very Good' },
  { grade: 'B3', min: 65, remark: 'Good' },
  { grade: 'C4', min: 60, remark: 'Credit' },
  { grade: 'C5', min: 55, remark: 'Credit' },
  { grade: 'C6', min: 50, remark: 'Credit' },
  { grade: 'D7', min: 45, remark: 'Pass' },
  { grade: 'E8', min: 40, remark: 'Pass' },
  { grade: 'F9', min: 0,  remark: 'Fail' },
];

export function calculateGrade(total) {
  for (const g of GRADE_SCALE) {
    if (total >= g.min) return { grade: g.grade, remark: g.remark };
  }
  return { grade: 'F9', remark: 'Fail' };
}

// ============================================
// LIST
// ============================================
export async function listReportCards({ studentId, session, status } = {}) {
  let q = supabase
    .from('report_cards')
    .select('*')
    .order('created_at', { ascending: false });

  if (studentId) q = q.eq('student_id', studentId);
  if (session) q = q.eq('session', session);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    console.error('listReportCards error:', error);
    throw error;
  }
  return data ?? [];
}

export async function getReportCard(id) {
  const { data, error } = await supabase
    .from('report_cards')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getMyReportCards(studentId) {
  const { data, error } = await supabase
    .from('report_cards')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================
// CRUD
// ============================================
export async function createReportCard(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('report_cards')
    .insert({ ...payload, created_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReportCard(id, updates) {
  const { data, error } = await supabase
    .from('report_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReportCard(id) {
  const { error } = await supabase.from('report_cards').delete().eq('id', id);
  if (error) throw error;
}

export async function publishReportCard(id) {
  return updateReportCard(id, { status: 'published' });
}

export async function unpublishReportCard(id) {
  return updateReportCard(id, { status: 'draft' });
}

// ============================================
// STATS
// ============================================
export function computeReportStats(scores) {
  if (!scores?.length) {
    return { total: 0, average: 0, subjects: 0, passed: 0, failed: 0 };
  }
  const total = scores.reduce((s, r) => s + (r.total ?? 0), 0);
  const average = Math.round(total / scores.length);
  const passed = scores.filter((s) => (s.total ?? 0) >= 40).length;
  const failed = scores.length - passed;

  return {
    total,
    average,
    subjects: scores.length,
    passed,
    failed,
  };
}