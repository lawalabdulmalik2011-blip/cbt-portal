import { supabase } from './supabase';

export async function getOrCreateSession({ classId, date, period }) {
  const { data: existing } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('class_id', classId)
    .eq('date', date)
    .eq('period', period ?? 0)
    .maybeSingle();

  if (existing) return existing;

  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      class_id: classId,
      date,
      period: period ?? 0,
      marked_by: session?.user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listRecords(sessionId) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function saveRecord({ sessionId, studentId, status, note }) {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(
      { session_id: sessionId, student_id: studentId, status, note },
      { onConflict: 'session_id,student_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function bulkMarkPresent({ sessionId, studentIds }) {
  const rows = studentIds.map((id) => ({
    session_id: sessionId,
    student_id: id,
    status: 'present',
  }));
  const { error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,student_id' });
  if (error) throw error;
}

export async function getStudentAttendanceSummary(studentId) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('student_id', studentId);
  if (error) throw error;

  const records = data ?? [];
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;

  return {
    total,
    present,
    late,
    absent,
    rate: total ? Math.round(((present + late) / total) * 100) : 0,
  };
}

export async function getClassMonthlyReport(classId, monthStart) {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const monthEndStr = monthEnd.toISOString().split('T')[0];

  const { data: sessions, error: sErr } = await supabase
    .from('attendance_sessions')
    .select('id, date')
    .eq('class_id', classId)
    .gte('date', monthStart)
    .lt('date', monthEndStr);
  if (sErr) throw sErr;
  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: records, error: rErr } = await supabase
    .from('attendance_records')
    .select('student_id, status')
    .in('session_id', sessionIds);
  if (rErr) throw rErr;

  const byStudent = {};
  (records ?? []).forEach((r) => {
    if (!byStudent[r.student_id]) {
      byStudent[r.student_id] = { present: 0, late: 0, absent: 0, total: 0 };
    }
    byStudent[r.student_id].total += 1;
    byStudent[r.student_id][r.status] = (byStudent[r.student_id][r.status] ?? 0) + 1;
  });

  return Object.entries(byStudent).map(([studentId, stats]) => ({
    studentId,
    ...stats,
    rate: stats.total
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0,
  }));
}