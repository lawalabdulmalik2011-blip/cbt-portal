import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  createReportCard,
  updateReportCard,
  calculateGrade,
  computeReportStats,
} from '../../lib/reportCards';
import { listSubjects } from '../../lib/questions';
import Spinner from '../ui/Spinner.jsx';

const SESSIONS = ['2024/2025', '2025/2026', '2026/2027'];
const TERMS = ['First', 'Second', 'Third'];

export default function ReportCardEditor({ open, onClose, student, report, onSaved }) {
  const isEdit = !!report;

  const [sessionYear, setSessionYear] = useState('2025/2026');
  const [term, setTerm] = useState('First');
  const [classLevel, setClassLevel] = useState('');
  const [scores, setScores] = useState([]);
  const [attendancePresent, setAttendancePresent] = useState(0);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [teacherComment, setTeacherComment] = useState('');
  const [principalComment, setPrincipalComment] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    listSubjects().then(setSubjects).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && report) {
      setSessionYear(report.session || '2025/2026');
      setTerm(report.term || 'First');
      setClassLevel(report.class_level || student?.class_level || '');
      setScores(report.scores || []);
      setAttendancePresent(report.attendance_present ?? 0);
      setAttendanceTotal(report.attendance_total ?? 0);
      setTeacherComment(report.teacher_comment || '');
      setPrincipalComment(report.principal_comment || '');
      setNextTermBegins(report.next_term_begins?.slice(0, 10) ?? '');
    } else {
      setSessionYear('2025/2026');
      setTerm('First');
      setClassLevel(student?.class_level || '');
      setScores([]);
      setAttendancePresent(0);
      setAttendanceTotal(0);
      setTeacherComment('');
      setPrincipalComment('');
      setNextTermBegins('');
    }
  }, [open, report, isEdit, student]);

  function addSubject() {
    setScores((prev) => [
      ...prev,
      { subject: '', ca: 0, exam: 0, total: 0, grade: 'F9', remark: 'Fail' },
    ]);
  }

  function updateScore(idx, field, value) {
    setScores((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };

      if (field === 'subject') {
        row.subject = value;
      } else if (field === 'ca' || field === 'exam') {
        row[field] = Math.max(0, Math.min(field === 'ca' ? 40 : 60, Number(value) || 0));
      }

      // Recalculate total + grade
      if (field === 'ca' || field === 'exam') {
        const ca = row.ca ?? 0;
        const exam = row.exam ?? 0;
        row.total = ca + exam;
        const g = calculateGrade(row.total);
        row.grade = g.grade;
        row.remark = g.remark;
      }

      next[idx] = row;
      return next;
    });
  }

  function removeSubject(idx) {
    setScores((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave(publish = false) {
    if (!classLevel.trim()) return toast.error('Class is required');
    if (!scores.length) return toast.error('Add at least one subject');

    // Validate each row has a subject name
    const missing = scores.find((s) => !s.subject?.trim());
    if (missing) return toast.error('All subject rows need a subject name');

    setBusy(true);
    try {
      const payload = {
        student_id: student.id,
        session: sessionYear,
        term,
        class_level: classLevel.trim(),
        scores,
        attendance_present: attendancePresent,
        attendance_total: attendanceTotal,
        teacher_comment: teacherComment.trim() || null,
        principal_comment: principalComment.trim() || null,
        next_term_begins: nextTermBegins || null,
        status: publish ? 'published' : (isEdit ? report.status : 'draft'),
      };

      if (isEdit) {
        await updateReportCard(report.id, payload);
        toast.success(publish ? 'Published' : 'Saved');
      } else {
        await createReportCard(payload);
        toast.success(publish ? 'Report card published 🎉' : 'Report card saved');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err.message?.includes('duplicate')) {
        toast.error('A report card already exists for this student + session + term');
      } else {
        toast.error(err.message || 'Failed to save');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!student) return null;
  const stats = computeReportStats(scores);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {student.photo_url ? (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-brand-500/30 flex-shrink-0">
                      <img
                        src={student.photo_url}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {student.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-slate-900">
                      {isEdit ? 'Edit report card' : 'New report card'}
                    </h2>
                    <p className="text-sm text-slate-500 font-mono">
                      {student.full_name} · {student.exam_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Session + Term + Class */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Session
                    </label>
                    <select
                      value={sessionYear}
                      onChange={(e) => setSessionYear(e.target.value)}
                      className="input"
                    >
                      {SESSIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Term
                    </label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="input"
                    >
                      {TERMS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Class
                    </label>
                    <input
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      placeholder="e.g. SS2A"
                      className="input"
                    />
                  </div>
                </div>

                {/* Scores table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Subjects ({scores.length})
                    </label>
                    <button
                      onClick={addSubject}
                      type="button"
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add subject
                    </button>
                  </div>

                  {scores.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                      <p className="text-sm text-slate-500">
                        No subjects yet. Click <strong>Add subject</strong> to begin.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                          <tr>
                            <th className="px-3 py-2 text-left">Subject</th>
                            <th className="px-2 py-2 w-16 text-center">CA<br/><span className="text-[9px] text-slate-400">/40</span></th>
                            <th className="px-2 py-2 w-16 text-center">Exam<br/><span className="text-[9px] text-slate-400">/60</span></th>
                            <th className="px-2 py-2 w-16 text-center">Total</th>
                            <th className="px-2 py-2 w-16 text-center">Grade</th>
                            <th className="px-2 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map((s, idx) => (
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                <input
                                  list="subject-list"
                                  value={s.subject ?? ''}
                                  onChange={(e) => updateScore(idx, 'subject', e.target.value)}
                                  placeholder="Subject name"
                                  className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-brand-500 focus:outline-none text-sm"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="40"
                                  value={s.ca ?? 0}
                                  onChange={(e) => updateScore(idx, 'ca', e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 focus:border-brand-500 focus:outline-none text-center text-sm"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="60"
                                  value={s.exam ?? 0}
                                  onChange={(e) => updateScore(idx, 'exam', e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 focus:border-brand-500 focus:outline-none text-center text-sm"
                                />
                              </td>
                              <td className="px-2 py-2 text-center font-semibold text-slate-700">
                                {s.total ?? 0}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                    (s.total ?? 0) >= 50
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : (s.total ?? 0) >= 40
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {s.grade ?? 'F9'}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  onClick={() => removeSubject(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <datalist id="subject-list">
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name} />
                        ))}
                      </datalist>
                    </div>
                  )}

                  {/* Stats bar */}
                  {scores.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <MiniStat label="Subjects" value={stats.subjects} />
                      <MiniStat label="Total" value={stats.total} />
                      <MiniStat label="Average" value={`${stats.average}%`} />
                      <MiniStat
                        label="Passed"
                        value={`${stats.passed}/${stats.subjects}`}
                        accent={stats.failed > 0 ? 'amber' : 'emerald'}
                      />
                    </div>
                  )}
                </div>

                {/* Attendance */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Attendance
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={attendancePresent}
                      onChange={(e) => setAttendancePresent(parseInt(e.target.value, 10) || 0)}
                      placeholder="Present"
                      className="input w-32"
                    />
                    <span className="text-slate-400">of</span>
                    <input
                      type="number"
                      min="0"
                      value={attendanceTotal}
                      onChange={(e) => setAttendanceTotal(parseInt(e.target.value, 10) || 0)}
                      placeholder="Total"
                      className="input w-32"
                    />
                    {attendanceTotal > 0 && (
                      <span className="text-sm font-semibold text-slate-600">
                        ({Math.round((attendancePresent / attendanceTotal) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Class teacher's comment
                  </label>
                  <textarea
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    placeholder="e.g. A diligent student. Keep up the good work!"
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Principal's comment
                  </label>
                  <textarea
                    value={principalComment}
                    onChange={(e) => setPrincipalComment(e.target.value)}
                    placeholder="e.g. Promoted to the next class."
                    rows={2}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Next term begins
                  </label>
                  <input
                    type="date"
                    value={nextTermBegins}
                    onChange={(e) => setNextTermBegins(e.target.value)}
                    className="input max-w-xs"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={busy}
                  className="btn-secondary flex-1"
                >
                  {busy ? <><Spinner size={16} /> Saving…</> : 'Save as draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? (
                    <><Spinner size={16} /> Publishing…</>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Save & publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MiniStat({ label, value, accent = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl p-3 ${colors[accent]}`}>
      <p className="text-[10px] uppercase tracking-wide font-bold opacity-70">
        {label}
      </p>
      <p className="font-display text-lg font-extrabold">{value}</p>
    </div>
  );
}