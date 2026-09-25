import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { listSubjects, listQuestions } from '../../lib/questions';
import { createExam, updateExam, setExamQuestions } from '../../lib/exams';
import Spinner from '../ui/Spinner.jsx';

const CLASS_OPTIONS = ['JSS1','JSS2','JSS3','SS1','SS2','SS3'];

export default function ExamForm({ open, onClose, exam, onSaved }) {
  const isEdit = !!exam;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(60);
  const [passMark, setPassMark] = useState(50);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleO, setShuffleO] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [allowRetake, setAllowRetake] = useState(false);
  const [targetClasses, setTargetClasses] = useState([]);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load subjects
  useEffect(() => {
    if (!open) return;
    listSubjects().then(setSubjects).catch(() => {});
  }, [open]);

  // Load questions when subject changes
  useEffect(() => {
    if (!open || !subjectId) {
      setAvailableQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    listQuestions({ subjectId })
      .then((qs) => {
        setAvailableQuestions(qs);
        // If editing, pre-select questions not yet loaded
        if (isEdit && exam?.questions) {
          setSelectedQuestionIds(exam.questions.map((q) => q.id));
        }
      })
      .catch(() => toast.error('Failed to load questions'))
      .finally(() => setLoadingQuestions(false));
  }, [subjectId, open, isEdit, exam]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    if (isEdit && exam) {
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setSubjectId(exam.subject_id || '');
      setDuration(exam.duration_minutes ?? 60);
      setPassMark(exam.pass_mark ?? 50);
      setShuffleQ(exam.shuffle_questions ?? true);
      setShuffleO(exam.shuffle_options ?? true);
      setShowResults(exam.show_results_immediately ?? true);
      setAllowRetake(exam.allow_retake ?? false);
      setTargetClasses(exam.target_classes || []);
      setStartAt(exam.start_at?.slice(0, 16) ?? '');
      setEndAt(exam.end_at?.slice(0, 16) ?? '');
      setSelectedQuestionIds(exam.questions?.map((q) => q.id) ?? []);
    } else {
      setTitle('');
      setDescription('');
      setSubjectId('');
      setDuration(60);
      setPassMark(50);
      setShuffleQ(true);
      setShuffleO(true);
      setShowResults(true);
      setAllowRetake(false);
      setTargetClasses([]);
      setStartAt('');
      setEndAt('');
      setSelectedQuestionIds([]);
    }
    setSearch('');
  }, [open, exam, isEdit]);

  function toggleQuestion(qid) {
    setSelectedQuestionIds((prev) =>
      prev.includes(qid) ? prev.filter((x) => x !== qid) : [...prev, qid]
    );
  }

  function toggleClass(c) {
    setTargetClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleSave() {
    if (!title.trim()) return toast.error('Title required');
    if (!subjectId) return toast.error('Pick a subject');
    if (selectedQuestionIds.length === 0) return toast.error('Select at least 1 question');

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId,
        duration_minutes: duration,
        pass_mark: passMark,
        shuffle_questions: shuffleQ,
        shuffle_options: shuffleO,
        show_results_immediately: showResults,
        allow_retake: allowRetake,
        target_classes: targetClasses.length ? targetClasses : null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
      };

      let savedExam;
      if (isEdit) {
        savedExam = await updateExam(exam.id, payload);
      } else {
        savedExam = await createExam(payload);
      }

      await setExamQuestions(savedExam.id, selectedQuestionIds);
      toast.success(isEdit ? 'Exam updated' : 'Exam created');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  const filteredQuestions = availableQuestions.filter((q) =>
    q.question_text.toLowerCase().includes(search.toLowerCase())
  );

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    {isEdit ? 'Edit exam' : 'Create exam'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {selectedQuestionIds.length} question{selectedQuestionIds.length === 1 ? '' : 's'} selected
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Body — 2 columns */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5">
                {/* Left column — settings */}
                <div className="md:col-span-3 p-6 overflow-y-auto border-r border-slate-100 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Exam title *
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. SS2 Mathematics — Mid-term"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Optional instructions or notes"
                      className="input resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setSelectedQuestionIds([]);
                      }}
                      className="input"
                    >
                      <option value="">— Choose subject —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.question_count} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Pass mark (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={passMark}
                        onChange={(e) => setPassMark(parseInt(e.target.value, 10) || 50)}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Start at
                      </label>
                      <input
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        End at
                      </label>
                      <input
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2">
                    <Toggle label="Shuffle questions" value={shuffleQ} onChange={setShuffleQ} />
                    <Toggle label="Shuffle answer options" value={shuffleO} onChange={setShuffleO} />
                    <Toggle label="Show results immediately" value={showResults} onChange={setShowResults} />
                    <Toggle label="Allow retakes" value={allowRetake} onChange={setAllowRetake} />
                  </div>

                  {/* Target classes */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Target classes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CLASS_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleClass(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                            targetClasses.includes(c)
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Leave empty to make visible to all classes
                    </p>
                  </div>
                </div>

                {/* Right column — question picker */}
                <div className="md:col-span-2 flex flex-col border-l border-slate-100">
                  <div className="p-4 border-b border-slate-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Questions ({selectedQuestionIds.length})
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="input pl-9 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    {!subjectId ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Choose a subject to see its questions
                      </p>
                    ) : loadingQuestions ? (
                      <Spinner className="py-8" />
                    ) : filteredQuestions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No questions found
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredQuestions.map((q) => {
                          const selected = selectedQuestionIds.includes(q.id);
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => toggleQuestion(q.id)}
                              className={`w-full text-left p-3 rounded-xl border-2 transition ${
                                selected
                                  ? 'border-brand-500 bg-brand-50'
                                  : 'border-slate-100 hover:border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 ${
                                    selected
                                      ? 'bg-brand-500 border-brand-500'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {selected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 uppercase font-semibold">
                                    {q.type.replace('_', '/')} · Lvl {q.difficulty}
                                  </p>
                                  <p className="text-sm text-slate-800 leading-snug line-clamp-2 mt-0.5">
                                    {q.question_text}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {availableQuestions.length > 0 && (
                    <div className="p-3 border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds(availableQuestions.map((q) => q.id))}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds([])}
                        className="text-xs font-semibold text-slate-500 hover:underline ml-auto"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? <><Spinner size={18} /> Saving…</> : isEdit ? 'Save changes' : 'Create exam'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition relative ${
          value ? 'bg-brand-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}