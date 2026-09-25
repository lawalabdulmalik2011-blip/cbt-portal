import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  listSlotsForClass,
  upsertSlot,
  deleteSlot,
  DAYS,
  PERIODS,
} from '../../lib/timetable';
import { listClasses } from '../../lib/classes';
import { listSubjects } from '../../lib/questions';
import { supabase } from '../../lib/supabase';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function TimetablePage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [cls, subs, tchs] = await Promise.all([
          listClasses(),
          listSubjects(),
          supabase
            .from('profiles')
            .select('id, full_name')
            .in('role', ['teacher', 'admin'])
            .then((r) => r.data ?? []),
        ]);
        setClasses(cls);
        setSubjects(subs);
        setTeachers(tchs);
        if (cls.length) setSelectedClass(cls[0]);
      } catch (err) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadSlots() {
    if (!selectedClass) return;
    try {
      const data = await listSlotsForClass(selectedClass.id);
      setSlots(data);
    } catch (err) {
      toast.error('Failed to load slots');
    }
  }

  useEffect(() => {
    loadSlots();
  }, [selectedClass]);

  function getSlot(day, period) {
    const slot = slots.find((s) => s.day_of_week === day && s.period === period);
    if (!slot) return null;
    return {
      ...slot,
      subject: subjects.find((x) => x.id === slot.subject_id),
      teacher: teachers.find((x) => x.id === slot.teacher_id),
    };
  }

  async function handleSave({ day, period, subjectId, teacherId, room }) {
    const p = PERIODS.find((x) => x.period === period);
    if (!p) return;
    try {
      await upsertSlot({
        class_id: selectedClass.id,
        day_of_week: day,
        period,
        start_time: p.start,
        end_time: p.end,
        subject_id: subjectId || null,
        teacher_id: teacherId || null,
        room: room || null,
      });
      toast.success('Saved');
      await loadSlots();
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSlot(id);
      toast.success('Removed');
      await loadSlots();
      setEditing(null);
    } catch (err) {
      toast.error('Failed');
    }
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              Timetable
            </h1>
            <p className="text-slate-500 mt-2">Weekly schedule per class</p>
          </div>

          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    selectedClass?.id === c.id
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {!selectedClass ? (
            <div className="glass rounded-2xl p-12 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No classes yet</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                        Period
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d.value}
                          className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 min-w-[140px]"
                        >
                          {d.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((p) => (
                      <tr key={p.period} className="border-t border-slate-100">
                        <td className="px-3 py-3 align-top">
                          <p className="font-bold text-slate-700">P{p.period}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.start}
                          </p>
                        </td>
                        {DAYS.map((d) => {
                          const slot = getSlot(d.value, p.period);
                          return (
                            <td key={d.value} className="px-1 py-1 align-top">
                              {slot?.subject_id ? (
                                <button
                                  onClick={() =>
                                    setEditing({ day: d.value, period: p.period })
                                  }
                                  className="w-full h-full min-h-[60px] rounded-lg p-2 text-left bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 hover:shadow-md transition"
                                >
                                  <p className="text-xs font-bold text-brand-900 line-clamp-2">
                                    {slot.subject?.name}
                                  </p>
                                  {slot.teacher && (
                                    <p className="text-[10px] text-brand-700 mt-0.5 truncate">
                                      {slot.teacher.full_name}
                                    </p>
                                  )}
                                  {slot.room && (
                                    <p className="text-[10px] text-brand-600 mt-0.5">
                                      📍 {slot.room}
                                    </p>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setEditing({ day: d.value, period: p.period })
                                  }
                                  className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:border-brand-400 hover:text-brand-500 transition flex items-center justify-center"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </PageTransition>

      {editing && selectedClass && (
        <SlotEditorModal
          editing={editing}
          existingSlot={getSlot(editing.day, editing.period)}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function SlotEditorModal({ editing, existingSlot, subjects, teachers, onClose, onSave, onDelete }) {
  const [subjectId, setSubjectId] = useState(existingSlot?.subject_id ?? '');
  const [teacherId, setTeacherId] = useState(existingSlot?.teacher_id ?? '');
  const [room, setRoom] = useState(existingSlot?.room ?? '');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!subjectId) return toast.error('Pick a subject');
    setBusy(true);
    try {
      await onSave({ ...editing, subjectId, teacherId, room });
    } finally {
      setBusy(false);
    }
  }

  const dayLabel = DAYS.find((d) => d.value === editing.day)?.label;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-extrabold text-slate-900">
            {dayLabel} · Period {editing.period}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="input"
            >
              <option value="">— Select —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="input"
            >
              <option value="">— Select —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Room</label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 12"
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {existingSlot?.id && (
            <button
              onClick={() => onDelete(existingSlot.id)}
              className="btn-secondary text-rose-600 hover:bg-rose-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy} className="btn-primary flex-1">
            {busy ? <><Spinner size={16} /> Saving…</> : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}