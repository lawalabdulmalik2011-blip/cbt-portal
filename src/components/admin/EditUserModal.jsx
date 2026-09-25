import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { deleteUser } from '../../lib/admin';
import { deleteStudentPhoto } from '../../lib/photos';
import PhotoUploader from './PhotoUploader';
import Spinner from '../ui/Spinner.jsx';

export default function EditUserModal({ open, onClose, user, onUpdated }) {
  const [fullName, setFullName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subjectSpecialty, setSubjectSpecialty] = useState('');
  const [role, setRole] = useState('student');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setClassLevel(user.class_level || '');
      setSubjectSpecialty(user.subject_specialty || '');
      setRole(user.role || 'student');
      setPhotoUrl(user.photo_url || null);
      setOriginalPhoto(user.photo_url || null);
      setConfirmDelete(false);
    }
  }, [user]);

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          class_level: role === 'student' ? (classLevel || null) : null,
          subject_specialty: role === 'teacher' ? (subjectSpecialty || null) : null,
          photo_url: photoUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      // If photo was replaced and old one existed, delete old
      if (originalPhoto && originalPhoto !== photoUrl) {
        await deleteStudentPhoto(originalPhoto);
      }

      toast.success('User updated');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      if (photoUrl) await deleteStudentPhoto(photoUrl);
      await deleteUser(user.id);
      toast.success('User deleted');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && user && (
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

              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Edit user
              </h2>
              <p className="text-slate-500 mt-1 mb-6 font-mono text-sm">
                {user.exam_number}
              </p>

              <div className="space-y-4">
                {/* Photo — for students */}
                {role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Student photo
                    </label>
                    <PhotoUploader
                      value={photoUrl}
                      onChange={setPhotoUrl}
                      studentId={user.id}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Role <span className="text-xs text-slate-400">(read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    readOnly
                    className="input bg-slate-50 capitalize cursor-not-allowed"
                  />
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Class
                    </label>
                    <input
                      type="text"
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      placeholder="e.g. SS1"
                      className="input"
                    />
                  </div>
                )}

                {role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Subject specialty
                    </label>
                    <input
                      type="text"
                      value={subjectSpecialty}
                      onChange={(e) => setSubjectSpecialty(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? <><Spinner size={18} /> Saving…</> : 'Save changes'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm text-rose-600 hover:underline flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete this user
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-rose-700">
                          Delete {user.full_name}?
                        </p>
                        <p className="text-xs text-rose-500 mt-0.5">
                          This cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="btn-secondary text-sm py-2 flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={busy}
                        className="btn-danger text-sm py-2 flex-1"
                      >
                        {busy ? 'Deleting…' : 'Yes, delete'}
                      </button>
                    </div>
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