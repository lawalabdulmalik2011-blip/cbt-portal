import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createNote, updateNote } from '../../lib/notes';
import { listSubjects } from '../../lib/questions';
import Spinner from '../ui/Spinner.jsx';

const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

export default function NoteEditorModal({ open, onClose, note, onSaved }) {
  const isEdit = !!note;

  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetClasses, setTargetClasses] = useState([]);
  const [dueAt, setDueAt] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    listSubjects().then(setSubjects).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && note) {
      setType(note.type || 'note');
      setTitle(note.title || '');
      setContent(note.content || '');
      setSubjectId(note.subject_id || '');
      setTargetClasses(note.target_classes || []);
      setDueAt(note.due_at?.slice(0, 16) ?? '');
    } else {
      setType('note');
      setTitle('');
      setContent('');
      setSubjectId('');
      setTargetClasses([]);
      setDueAt('');
    }
  }, [open, note, isEdit]);

  function toggleClass(c) {
    setTargetClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        subject_id: subjectId || null,
        target_classes: targetClasses.length ? targetClasses : null,
        type,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      };

      if (isEdit) {
        await updateNote(note.id, payload);
        toast.success(`${type === 'assignment' ? 'Assignment' : 'Note'} updated`);
      } else {
        await createNote(payload);
        toast.success(`${type === 'assignment' ? 'Assignment' : 'Note'} created`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    {isEdit ? 'Edit' : 'New'} {type === 'assignment' ? 'assignment' : 'note'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Share study material or an assignment with your students
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'note', label: '📖 Note', desc: 'Study material' },
                      { key: 'assignment', label: '✍️ Assignment', desc: 'Students submit answers' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setType(t.key)}
                        className={`p-3 rounded-xl text-left border-2 transition ${
                          type === t.key
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-sm text-slate-800">{t.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 3: Quadratic Equations"
                    className="input"
                    autoFocus
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {type === 'assignment' ? 'Instructions / Question *' : 'Content *'}
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      type === 'assignment'
                        ? 'Write the assignment question or instructions here…'
                        : 'Write the note content here. Students will see this.'
                    }
                    rows={10}
                    className="input resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    {content.length} characters · Students can copy this text
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="input"
                  >
                    <option value="">— No subject —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
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
                    Leave empty to send to all students
                  </p>
                </div>

                {/* Due date for assignments */}
                {type === 'assignment' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Due date
                    </label>
                    <input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      className="input"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Students will see a countdown to this deadline
                    </p>
                  </div>
                )}
              </div>

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
                    <>
                      {type === 'assignment' ? (
                        <PencilSquareIcon className="w-4 h-4" />
                      ) : (
                        <DocumentTextIcon className="w-4 h-4" />
                      )}
                      Create
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