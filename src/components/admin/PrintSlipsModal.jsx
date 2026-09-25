import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Logo from '../ui/Logo.jsx';

export default function PrintSlipsModal({ open, onClose, users }) {
  const [passwordOverrides, setPasswordOverrides] = useState({});

  useEffect(() => {
    if (!open) {
      setPasswordOverrides({});
    }
  }, [open]);

  function updatePassword(userId, pwd) {
    setPasswordOverrides((prev) => ({ ...prev, [userId]: pwd }));
  }

  function handlePrint() {
    window.print();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 print:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col print:rounded-none print:shadow-none print:max-h-none print:max-w-none">
              {/* Modal header — hidden on print */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 print:hidden">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    Print login slips
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    {users.length} slip{users.length === 1 ? '' : 's'} ready to print
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="btn-primary">
                    <PrinterIcon className="w-5 h-5" />
                    Print
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Password hint banner — hidden on print */}
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 print:hidden">
                💡 <strong>Tip:</strong> If you already created these users and forgot the passwords,
                type them in below. Passwords are only shown once at creation time.
              </div>

              {/* Slips container — this is what prints */}
              <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                  {users.map((u) => (
                    <Slip
                      key={u.id}
                      user={u}
                      password={passwordOverrides[u.id] ?? u.password ?? '••••••••'}
                      onPasswordChange={(pwd) => updatePassword(u.id, pwd)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Print-only global styles */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body * {
                visibility: hidden;
              }
              .print-slip, .print-slip * {
                visibility: visible;
              }
              .print-slip {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

function Slip({ user, password, onPasswordChange }) {
  return (
    <div className="print-slip border-2 border-slate-200 rounded-2xl p-5 bg-white relative overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-accent-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <Logo size={28} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          Login Slip
        </span>
      </div>

      {/* User info */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">
          Name
        </p>
        <p className="font-display font-bold text-slate-900 text-lg leading-tight truncate">
          {user.full_name}
        </p>
      </div>

      {/* Credentials grid */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Exam Number" value={user.exam_number} mono />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">
            Password
          </p>
          <input
            type="text"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full font-mono text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-brand-500 focus:outline-none py-0.5 print:border-none"
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
            Role
          </span>
          <span className="text-xs font-semibold text-slate-700 capitalize">
            {user.role}
          </span>
        </div>
        {user.class_level && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              Class
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {user.class_level}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
        <p className="text-[9px] text-slate-400 leading-tight">
          Sign in at <span className="font-mono">exampro.app</span> with your exam number.
          Keep this slip safe — do not share your password.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">
        {label}
      </p>
      <p className={`text-slate-900 text-sm ${mono ? 'font-mono' : ''} truncate`}>
        {value}
      </p>
    </div>
  );
}