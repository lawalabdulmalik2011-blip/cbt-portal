import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createAnnouncement, updateAnnouncement } from '../../lib/announcements';
import Spinner from '../ui/Spinner.jsx';

const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

export default function AnnouncementModal({ open, onClose, announcement, onSaved }) {
  const isEdit = !!announcement;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('info');
  const [targetRoles, setTargetRoles] = useState(['student', 'teacher']);
  const [targetClasses, setTargetClasses] = useState([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && announcement) {
      setTitle(announcement.title || '');
      setContent(announcement.content || '');
      setPriority(announcement.priority || 'info');
      setTargetRoles(announcement.target_roles || ['student', 'teacher']);
      setTargetClasses(announcement.target_classes || []);
      setExpiresAt(announcement.expires_at?.slice(0, 16) ?? '');
    } else {
      setTitle('');
      setContent('');
      setPriority('info');
      setTargetRoles(['student', 'teacher']);
      setTargetClasses([]);
      setExpiresAt('');
    }
  }, [open, announcement, isEdit]);

  function toggleRole(r) {
    setTargetRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  function toggleClass(c) {
    setTargetClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleSave() {
    if (!title.trim()) return toast.error('Title required');
    if (!content.trim()) return toast.error('Content required');

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        target_roles: targetRoles,
        target_classes: targetClasses.length ? targetClasses : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (isEdit) {
        await updateAnnouncement(announcement.id, payload);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(payload);
        toast.success('Announcement sent');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const PRIORITIES = [
    { key: 'info', label: '📘 Info', color: 'from-blue-500 to-blue-600' },
    { key: 'warning', label: '⚠️ Warning', color: 'from-amber-500 to-orange-600' },
    { key: 'urgent', label: '🚨 Urgent', color: 'from-rose-500 to-red-600' },
  ];

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-8 pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-6">
                {isEdit ? 'Edit announcement' : 'New announcement'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPriority(p.key)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                          priority === p.key
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Exam starts tomorrow"
                    className="input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your announcement…"
                    rows={4}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Send to
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['student', 'teacher', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition capitalize ${
                          targetRoles.includes(r)
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {r}s
                      </button>
                    ))}
                  </div>
                </div>

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
                  <p className="text-xs text-slate-400 mt-1.5">
                    Empty = send to all classes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expires
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Leave blank to keep it forever
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? (
                    <><Spinner size={16} /> Saving…</>
                  ) : isEdit ? (
                    'Save'
                  ) : (
                    'Send announcement'
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