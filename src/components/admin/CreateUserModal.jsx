import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  createUser,
  nextExamNumber,
  generatePassword,
} from '../../lib/admin';
import { supabase } from '../../lib/supabase';
import RoleBadge from './RoleBadge';
import PhotoUploader from './PhotoUploader';
import Spinner from '../ui/Spinner.jsx';

export default function CreateUserModal({ open, onClose, onCreated }) {
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [examNumber, setExamNumber] = useState('');
  const [password, setPassword] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subjectSpecialty, setSubjectSpecialty] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    if (!open) return;
    nextExamNumber(role).then(setExamNumber);
    setPassword(generatePassword());
  }, [role, open]);

  useEffect(() => {
    if (!open) {
      setRole('student');
      setFullName('');
      setExamNumber('');
      setPassword('');
      setClassLevel('');
      setSubjectSpecialty('');
      setPhotoUrl(null);
      setCreatedCredentials(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim() || !examNumber.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBusy(true);
    try {
      const result = await createUser({
        exam_number: examNumber.trim(),
        full_name: fullName.trim(),
        password,
        role,
        class_level: role === 'student' ? classLevel : undefined,
        subject_specialty: role === 'teacher' ? subjectSpecialty : undefined,
      });

      // Save photo if uploaded
      if (photoUrl && result.user?.id) {
        await supabase
          .from('profiles')
          .update({ photo_url: photoUrl })
          .eq('id', result.user.id);
      }

      setCreatedCredentials({
        exam_number: result.user.exam_number,
        full_name: result.user.full_name,
        password: result.password,
        role: result.user.role,
      });
      toast.success('User created successfully');
      onCreated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setBusy(false);
    }
  }

  function copyCredentials() {
    const text = `ExamPro Login\n\nName: ${createdCredentials.full_name}\nExam Number: ${createdCredentials.exam_number}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied');
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-8 pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {!createdCredentials ? (
                <>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    Register new user
                  </h2>
                  <p className="text-slate-500 mt-1 mb-6">
                    Create a student, teacher, or admin account.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Role
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['student', 'teacher', 'admin'].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                              role === r
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {r[0].toUpperCase() + r.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo — only for students */}
                    {role === 'student' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Student photo
                        </label>
                        <PhotoUploader
                          value={photoUrl}
                          onChange={setPhotoUrl}
                          studentId={`new-${Date.now()}`}
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
                        placeholder="e.g. Adebayo Folake"
                        className="input"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Exam number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={examNumber}
                          onChange={(e) => setExamNumber(e.target.value)}
                          className="input font-mono pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => nextExamNumber(role).then(setExamNumber)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-600"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      </div>
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
                          placeholder="e.g. SS3A"
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

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input font-mono pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setPassword(generatePassword())}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-600"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={busy} className="btn-primary flex-1">
                        {busy ? <><Spinner size={18} /> Creating…</> : 'Create user'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="font-display text-2xl font-extrabold text-slate-900">
                      User created 🎉
                    </h2>
                    <p className="text-slate-500 mt-1">
                      Save these credentials — they won't be shown again.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                    <Row label="Name" value={createdCredentials.full_name} />
                    <Row label="Exam Number" value={createdCredentials.exam_number} mono />
                    <Row label="Password" value={createdCredentials.password} mono />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Role</span>
                      <RoleBadge role={createdCredentials.role} />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={copyCredentials} className="btn-secondary flex-1">
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Copy
                    </button>
                    <button onClick={onClose} className="btn-primary flex-1">
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}