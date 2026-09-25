import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { listSubmissions, gradeSubmission } from '../../lib/notes';
import Spinner from '../ui/Spinner.jsx';

export default function NoteSubmissionsModal({ open, onClose, note }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [gradeInput, setGradeInput] = useState({});

  useEffect(() => {
    if (!open || !note) return;
    setLoading(true);
    listSubmissions(note.id)
      .then(setSubs)
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [open, note]);

  async function handleGrade(sub) {
    const score = parseInt(gradeInput[sub.id]?.score ?? '', 10);
    const feedback = gradeInput[sub.id]?.feedback ?? '';
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Enter a score 0-100');
      return;
    }
    try {
      await gradeSubmission(sub.id, score, feedback);
      toast.success('Graded');
      const updated = await listSubmissions(note.id);
      setSubs(updated);
      setExpandedId(null);
    } catch (err) {
      toast.error('Failed to grade');
    }
  }

  if (!note) return null;
  const isAssignment = note.type === 'assignment';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl max-h-[88vh] rounded-3xl bg-white shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
              <div className="flex items-start justify-between p-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isAssignment
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {isAssignment ? 'Assignment' : 'Note'}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 truncate">
                    {note.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {subs.length} submission{subs.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <Spinner className="py-12" />
                ) : !isAssignment ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">
                      Notes don't require submissions. Only assignments do.
                    </p>
                  </div>
                ) : subs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <ClockIcon className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subs.map((sub) => {
                      const profile = sub.profile;
                      const expanded = expandedId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          className="border border-slate-200 rounded-2xl overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-4 hover:bg-slate-50/50 cursor-pointer"
                            onClick={() => setExpandedId(expanded ? null : sub.id)}
                          >
                            {profile?.photo_url ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                                <img
                                  src={profile.photo_url}
                                  alt={profile.full_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {profile?.full_name ?? 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate">
                                {profile?.exam_number}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {sub.score !== null && sub.score !== undefined ? (
                                <p className="font-display font-bold text-emerald-600">
                                  {sub.score}%
                                </p>
                              ) : (
                                <span className="text-xs text-amber-600 font-semibold">
                                  Ungraded
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400">
                                {new Date(sub.submitted_at).toLocaleString(
                                  'en-NG',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                          </div>

                          {expanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-slate-100 bg-slate-50 p-4"
                            >
                              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                                Student answer
                              </p>
                              <div className="bg-white rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap mb-4">
                                {sub.content}
                              </div>

                              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                                Grade
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Score"
                                  defaultValue={sub.score ?? ''}
                                  onChange={(e) =>
                                    setGradeInput((g) => ({
                                      ...g,
                                      [sub.id]: {
                                        ...g[sub.id],
                                        score: e.target.value,
                                      },
                                    }))
                                  }
                                  className="input w-24"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback (optional)"
                                  defaultValue={sub.feedback ?? ''}
                                  onChange={(e) =>
                                    setGradeInput((g) => ({
                                      ...g,
                                      [sub.id]: {
                                        ...g[sub.id],
                                        feedback: e.target.value,
                                      },
                                    }))
                                  }
                                  className="input flex-1"
                                />
                                <button
                                  onClick={() => handleGrade(sub)}
                                  className="btn-primary"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Save
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}