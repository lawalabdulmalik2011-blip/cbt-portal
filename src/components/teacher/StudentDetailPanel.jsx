import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  getStudentProfile,
  reopenAttempt,
  deleteAttempt,
  getProctorLogs,
} from '../../lib/studentAdmin';
import Spinner from '../ui/Spinner.jsx';

const STATUS_STYLE = {
  in_progress: 'bg-amber-100 text-amber-700',
  submitted: 'bg-emerald-100 text-emerald-700',
  flagged: 'bg-rose-100 text-rose-700',
};

export default function StudentDetailPanel({ studentId, onClose, onChanged }) {
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [logs, setLogs] = useState({});

  async function load() {
    setLoading(true);
    try {
      const { profile: p, attempts: a } = await getStudentProfile(studentId);
      setProfile(p);
      setAttempts(a);
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [studentId]);

  async function handleReopen(attempt) {
    if (
      !confirm(
        `Reopen "${attempt.exams?.title}" for ${profile.full_name}?\n\nThis will:\n• Delete current answers\n• Reset their score\n• Clear violations\n• Give them a fresh attempt`
      )
    )
      return;
    setBusy(attempt.id);
    try {
      await reopenAttempt(attempt.id);
      toast.success('Attempt reopened');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Failed to reopen');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(attempt) {
    if (!confirm('Permanently delete this attempt?')) return;
    setBusy(attempt.id);
    try {
      await deleteAttempt(attempt.id);
      toast.success('Attempt deleted');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setBusy(null);
    }
  }

  async function toggleLogs(attemptId) {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
      return;
    }
    setExpandedAttempt(attemptId);
    if (!logs[attemptId]) {
      try {
        const data = await getProctorLogs(attemptId);
        setLogs((prev) => ({ ...prev, [attemptId]: data }));
      } catch (err) {
        toast.error('Failed to load logs');
      }
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              {profile?.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-xs text-slate-500">
                {profile?.exam_number}
              </span>
              {profile?.class_level && (
                <span className="badge bg-slate-100 text-slate-600">
                  {profile.class_level}
                </span>
              )}
              {!profile?.is_active && (
                <span className="badge bg-rose-100 text-rose-700">Suspended</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div>
        <h3 className="font-display font-bold text-slate-800 mb-3">
          Exam history ({attempts.length})
        </h3>

        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-xl">
            No exam attempts yet
          </p>
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => {
              const exam = a.exams;
              const isBusy = busy === a.id;

              return (
                <div
                  key={a.id}
                  className={`border rounded-xl overflow-hidden transition ${
                    a.is_flagged
                      ? 'border-rose-200 bg-rose-50/30'
                      : a.status === 'submitted'
                      ? 'border-emerald-100 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`badge ${STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                        {a.is_flagged && (
                          <span className="badge bg-rose-100 text-rose-700">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            Flagged
                          </span>
                        )}
                        {a.reset_count > 0 && (
                          <span className="badge bg-brand-100 text-brand-700 text-[10px]">
                            Reset ×{a.reset_count}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 truncate">
                        {exam?.title ?? 'Unknown exam'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {exam?.subjects && (
                          <span style={{ color: exam.subjects.color }}>
                            {exam.subjects.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {a.started_at
                            ? new Date(a.started_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {a.status === 'submitted' && (
                      <div className="text-right">
                        <p
                          className={`font-display text-2xl font-extrabold ${
                            a.passed ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {a.score ?? 0}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {a.passed ? 'Passed' : 'Failed'}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReopen(a)}
                        disabled={isBusy}
                        className="text-xs font-semibold text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        {isBusy ? '…' : 'Reopen'}
                      </button>
                      <button
                        onClick={() => toggleLogs(a.id)}
                        className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        {expandedAttempt === a.id ? 'Hide' : 'Logs'}
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={isBusy}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedAttempt === a.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 p-4 bg-slate-50"
                    >
                      <p className="text-xs font-bold text-slate-600 uppercase mb-2">
                        Proctoring events ({(logs[a.id] ?? []).length})
                      </p>
                      {(logs[a.id] ?? []).length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No violations recorded 🎉
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {(logs[a.id] ?? []).map((l) => (
                            <div
                              key={l.id}
                              className="text-xs flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-slate-100"
                            >
                              <span className="font-mono text-rose-600 font-semibold">
                                {l.event_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-slate-400">
                                {new Date(l.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}