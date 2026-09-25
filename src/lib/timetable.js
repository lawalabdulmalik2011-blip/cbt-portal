import { supabase } from './supabase';

export const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const PERIODS = [
  { period: 1, start: '08:00', end: '08:45' },
  { period: 2, start: '08:45', end: '09:30' },
  { period: 3, start: '09:30', end: '10:15' },
  { period: 4, start: '10:30', end: '11:15' },
  { period: 5, start: '11:15', end: '12:00' },
  { period: 6, start: '12:00', end: '12:45' },
  { period: 7, start: '13:30', end: '14:15' },
  { period: 8, start: '14:15', end: '15:00' },
];

export async function listSlotsForClass(classId) {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('class_id', classId)
    .order('day_of_week')
    .order('period');
  if (error) throw error;
  return data ?? [];
}

export async function listSlotsForTeacher(teacherId) {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('period');
  if (error) throw error;
  return data ?? [];
}

export async function upsertSlot(slot) {
  const { data, error } = await supabase
    .from('timetable_slots')
    .upsert(slot, { onConflict: 'class_id,day_of_week,start_time' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSlot(id) {
  const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
  if (error) throw error;
}