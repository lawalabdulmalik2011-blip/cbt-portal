import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { generatePassword, resetUserPassword } from '../../lib/admin'; 
import Spinner from '../ui/Spinner.jsx';

export default function ResetPasswordModal({ open, onClose, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword(generatePassword());
      setDone(false);
    }
  }, [open]);

async function handleReset() {
  setBusy(true);
  try {
    await resetUserPassword(user.id, newPassword);
    setDone(true);
    toast.success('Password reset');
  } catch (err) {
    toast.error(err.message || 'Failed to reset password');
  } finally {
    setBusy(false);
  }
}

  function copyPassword() {
    navigator.clipboard.writeText(newPassword);
    toast.success('Password copied');
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {!done ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
                    <KeyIcon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    Reset password
                  </h2>
                  <p className="text-slate-500 mt-1 mb-6">
                    Generate a new password for <strong>{user.full_name}</strong>.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input font-mono pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setNewPassword(generatePassword())}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-600"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Share this with the user. They should change it after first login.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={busy}
                      className="btn-primary flex-1"
                    >
                      {busy ? <><Spinner size={18} /> Resetting…</> : 'Reset password'}
                    </button>
                  </div>
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
                      Password updated
                    </h2>
                    <p className="text-slate-500 mt-1">Share this with {user.full_name}.</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Exam Number</p>
                    <p className="font-mono text-slate-800 mb-3">{user.exam_number}</p>
                    <p className="text-xs text-slate-500 mb-1">New Password</p>
                    <p className="font-mono text-lg font-bold text-slate-900">{newPassword}</p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={copyPassword} className="btn-secondary flex-1">
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