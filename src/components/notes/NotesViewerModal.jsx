import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  PaperAirplaneIcon,
  BookOpenIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { submitNote, getMySubmission } from '../../lib/notes';
import Spinner from '../ui/Spinner.jsx';

export default function NotesViewerModal({ open, onClose, note, onSubmitted }) {
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!open || !note) return;
    if (note.type === 'assignment') {
      getMySubmission(note.id).then((s) => {
        setMySubmission(s);
        if (s) setAnswer(s.content || '');
      });
    }
  }, [open, note]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Copy failed — try manually');
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) {
      toast.error('Please write your answer first');
      return;
    }
    setSubmitting(true);
    try {
      await submitNote({ noteId: note.id, content: answer.trim() });
      toast.success('Submitted successfully 🎉');
      onSubmitted?.();
      // Re-fetch submission to update UI
      const updated = await getMySubmission(note.id);
      setMySubmission(updated);
    } catch (err) {
      toast.error(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!note) return null;

  const subject = note.subjects;
  const isAssignment = note.type === 'assignment';
  const dueAt = note.due_at ? new Date(note.due_at).getTime() : null;
  const dueIn = dueAt && dueAt > now ? dueAt - now : 0;
  const overdue = dueAt && dueAt <= now;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none overflow-y-auto"
          >
            <div className="w-full max-w-4xl max-h-[92vh] pointer-events-auto my-8">
              {/* iPad-style frame */}
              <div className="relative rounded-[32px] shadow-2xl overflow-hidden bg-gradient-to-br from-slate-100/90 via-white/95 to-slate-50/90 backdrop-blur-2xl border border-white/60">
                {/* Top notch-style bar */}
                <div className="h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-pink-500" />

                {/* Header */}
                <div className="relative px-6 sm:px-8 pt-5 pb-4 border-b border-slate-200/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                          isAssignment
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-brand-500 to-accent-500'
                        }`}
                      >
                        {isAssignment ? (
                          <PencilSquareIcon className="w-7 h-7 text-white" />
                        ) : (
                          <BookOpenIcon className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isAssignment
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            {isAssignment ? 'Assignment' : 'Note'}
                          </span>
                          {subject && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${subject.color}20`,
                                color: subject.color,
                              }}
                            >
                              {subject.name}
                            </span>
                          )}
                          {mySubmission && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircleIcon className="w-3 h-3" />
                              Submitted
                            </span>
                          )}
                        </div>
                        <h2 className="font-display text-2xl font-extrabold text-slate-900 leading-tight truncate">
                          {note.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {note.profile?.full_name ?? 'Teacher'} ·{' '}
                          {new Date(note.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex-shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Due-date banner for assignments */}
                  {isAssignment && dueAt && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                        overdue
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : dueIn < 24 * 3600_000
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}
                    >
                      <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">
                        {overdue ? (
                          <>
                            Overdue — was due{' '}
                            {new Date(note.due_at).toLocaleString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : (
                          <>
                            Due in{' '}
                            <strong>{formatDuration(dueIn)}</strong> ·{' '}
                            {new Date(note.due_at).toLocaleString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </span>
                      {!overdue && <ClockIcon className="w-4 h-4 animate-pulse" />}
                    </motion.div>
                  )}
                </div>

                {/* Content area — scrollable */}
                <div className="overflow-y-auto max-h-[60vh] px-6 sm:px-8 py-6">
                  {/* Content card */}
                  <div className="relative">
                    <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/70 p-6 shadow-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                        {isAssignment ? 'Instructions' : 'Content'}
                      </p>
                      <div className="text-slate-800 leading-relaxed whitespace-pre-wrap font-sans text-[15px]">
                        {note.content}
                      </div>
                    </div>

                    {/* Copy button — floating */}
                    <button
                      onClick={handleCopy}
                      className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                        copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-lg border border-slate-200'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Answer box for assignments */}
                  {isAssignment && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                          Your answer
                        </p>
                        {mySubmission && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Submitted{' '}
                            {new Date(mySubmission.submitted_at).toLocaleString(
                              'en-NG',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        )}
                      </div>

                      <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/70 p-1 shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 transition">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Write your answer here. You can type or paste from the note above…"
                          rows={6}
                          className="w-full resize-none bg-transparent px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none font-sans text-[15px] leading-relaxed"
                        />
                      </div>

                      {/* Graded result if teacher graded */}
                      {mySubmission?.score !== null &&
                        mySubmission?.score !== undefined && (
                          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs uppercase tracking-wide text-emerald-700 font-bold">
                                Graded
                              </p>
                              <p className="font-display text-2xl font-extrabold text-emerald-700">
                                {mySubmission.score}%
                              </p>
                            </div>
                            {mySubmission.feedback && (
                              <p className="text-sm text-emerald-800 leading-relaxed">
                                <strong>Feedback:</strong> {mySubmission.feedback}
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      {isAssignment
                        ? mySubmission
                          ? 'You can update your answer anytime'
                          : 'Answer and submit when ready'
                        : 'Read, copy, and study at your pace'}
                    </p>
                    <div className="flex gap-2">
                      {isAssignment && (
                        <button
                          onClick={handleSubmit}
                          disabled={submitting || !answer.trim()}
                          className="btn-primary py-2.5 px-5 text-sm"
                        >
                          {submitting ? (
                            <>
                              <Spinner size={14} /> Submitting…
                            </>
                          ) : mySubmission ? (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              Update answer
                            </>
                          ) : (
                            <>
                              <PaperAirplaneIcon className="w-4 h-4" />
                              Submit answer
                            </>
                          )}
                        </button>
                      )}
                      <button onClick={onClose} className="btn-secondary py-2.5 px-5 text-sm">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}