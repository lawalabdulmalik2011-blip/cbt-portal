import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  createQuestion,
  updateQuestion,
  deleteQuestionImage,
} from '../../lib/questions';
import ImageUploader from './ImageUploader';
import Spinner from '../ui/Spinner.jsx';

const TYPES = [
  { key: 'mcq', label: 'Multiple Choice' },
  { key: 'true_false', label: 'True / False' },
  { key: 'short_answer', label: 'Short Answer' },
  { key: 'essay', label: 'Essay' },
];

const DEFAULT_OPTIONS = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
  { key: 'D', text: '' },
];

export default function QuestionEditor({ open, onClose, subjectId, question, onSaved }) {
  const isEdit = !!question;

  const [type, setType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [points, setPoints] = useState(1);
  const [busy, setBusy] = useState(false);

  // Load existing question for edit
  useEffect(() => {
    if (question) {
      setType(question.type || 'mcq');
      setQuestionText(question.question_text || '');
      setQuestionImage(question.question_image_url || null);
      setOptions(question.options?.length ? question.options : DEFAULT_OPTIONS);
      setCorrectAnswer(
        typeof question.correct_answer === 'string'
          ? question.correct_answer
          : Array.isArray(question.correct_answer)
          ? question.correct_answer[0]
          : ''
      );
      setExplanation(question.explanation || '');
      setTopic(question.topic || '');
      setDifficulty(question.difficulty ?? 3);
      setPoints(question.points ?? 1);
    } else {
      // Reset
      setType('mcq');
      setQuestionText('');
      setQuestionImage(null);
      setOptions(DEFAULT_OPTIONS);
      setCorrectAnswer('');
      setExplanation('');
      setTopic('');
      setDifficulty(3);
      setPoints(1);
    }
  }, [question, open]);

  function updateOption(idx, text) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  function addOption() {
    const nextKey = String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { key: nextKey, text: '' }]);
  }

  function removeOption(idx) {
    if (options.length <= 2) {
      toast.error('At least 2 options required');
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, key: String.fromCharCode(65 + i) })));
    setCorrectAnswer('');
  }

  async function handleSave() {
    // Validate
    if (!questionText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (!subjectId) {
      toast.error('Select a subject first');
      return;
    }

    if (type === 'mcq') {
      const filledOptions = options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        toast.error('Provide at least 2 options');
        return;
      }
      if (!correctAnswer) {
        toast.error('Mark the correct option');
        return;
      }
    }
    if (type === 'true_false' && !correctAnswer) {
      toast.error('Choose the correct answer');
      return;
    }
    if ((type === 'short_answer' || type === 'essay') && !correctAnswer.trim()) {
      toast.error('Provide the expected answer');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        subject_id: subjectId,
        type,
        question_text: questionText.trim(),
        question_image_url: questionImage,
        options: type === 'mcq' ? options.filter((o) => o.text.trim()) : null,
        correct_answer:
          type === 'mcq'
            ? correctAnswer
            : type === 'true_false'
            ? correctAnswer
            : correctAnswer.trim(),
        explanation: explanation.trim() || null,
        topic: topic.trim() || null,
        difficulty,
        points,
      };

      if (isEdit) {
        await updateQuestion(question.id, payload);
        toast.success('Question updated');
      } else {
        await createQuestion(payload);
        toast.success('Question created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteImage() {
    if (questionImage) await deleteQuestionImage(questionImage);
  }

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    {isEdit ? 'Edit question' : 'New question'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Fill in the details below
                  </p>
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
                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Question type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setType(t.key);
                          setCorrectAnswer('');
                        }}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                          type === t.key
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question text */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Question
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type the question here…"
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Attach image
                  </label>
                  <ImageUploader
                    value={questionImage}
                    onChange={setQuestionImage}
                    onRemove={handleDeleteImage}
                  />
                </div>

                {/* Options — MCQ */}
                {type === 'mcq' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Add option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {options.map((o, idx) => (
                        <div key={o.key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswer(o.key)}
                            className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm border-2 transition ${
                              correctAnswer === o.key
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400'
                            }`}
                            title="Mark as correct"
                          >
                            {correctAnswer === o.key ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              o.key
                            )}
                          </button>
                          <input
                            type="text"
                            value={o.text}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            placeholder={`Option ${o.key}`}
                            className="input flex-1"
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(idx)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Click the letter button to mark the correct answer
                    </p>
                  </div>
                )}

                {/* True / False */}
                {type === 'true_false' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Correct answer
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['true', 'false'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCorrectAnswer(v)}
                          className={`py-3 rounded-xl text-sm font-semibold border-2 transition capitalize ${
                            correctAnswer === v
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short answer / Essay */}
                {(type === 'short_answer' || type === 'essay') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {type === 'short_answer' ? 'Expected answer' : 'Model answer'}
                    </label>
                    <textarea
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      placeholder="The correct answer the system will match against…"
                      rows={type === 'essay' ? 4 : 2}
                      className="input resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      {type === 'essay'
                        ? 'Essays are manually graded by teachers.'
                        : 'Auto-graded — case insensitive, trimmed.'}
                    </p>
                  </div>
                )}

                {/* Topic, difficulty, points */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Algebra"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                      className="input"
                    >
                      <option value="1">1 — Easy</option>
                      <option value="2">2 — Simple</option>
                      <option value="3">3 — Medium</option>
                      <option value="4">4 — Hard</option>
                      <option value="5">5 — Very hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value, 10) || 1)}
                      className="input"
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Shown to students after submission"
                    rows={2}
                    className="input resize-none"
                  />
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
                  {busy ? (
                    <>
                      <Spinner size={18} /> Saving…
                    </>
                  ) : isEdit ? (
                    'Save changes'
                  ) : (
                    'Create question'
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