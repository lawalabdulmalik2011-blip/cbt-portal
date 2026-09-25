import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, HomeIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function SubmitConfirmation({ exam, result, flagged, onHome }) {
  const passed = result?.passed;
  const score = result?.score ?? 0;

  // Prevent browser back from re-entering the exam
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const blockBack = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  // Prevent refresh from re-entering exam (warn user)
  useEffect(() => {
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam has been submitted. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 flex items-center justify-center p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center my-8"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-6 ${
            flagged
              ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/40'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40'
          }`}
        >
          <CheckCircleIcon className="w-14 h-14 text-white" />
        </motion.div>

        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          {flagged ? 'Exam Submitted (Flagged)' : 'Exam Submitted!'}
        </h1>
        <p className="text-slate-500 mt-2">
          <span className="font-semibold text-slate-700">{exam?.title}</span>
        </p>

        {flagged ? (
          <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-left">
            <p className="text-sm text-rose-700 leading-relaxed">
              Your exam was auto-submitted due to security violations and has
              been flagged for review. Please contact your teacher for details.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                  Your Score
                </p>
                <p
                  className={`font-display text-4xl font-extrabold ${
                    passed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {score}%
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                  Result
                </p>
                <p
                  className={`font-display text-2xl font-extrabold ${
                    passed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {passed ? 'Passed' : 'Failed'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Your teacher will review the results.
            </p>
          </>
        )}

        {/* Info about lockout */}
        <div className="mt-6 p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <p className="text-xs text-brand-800 leading-relaxed">
            <strong>🔒 Exam locked.</strong> You cannot re-enter this exam
            unless your teacher reopens it. Use the buttons below to continue.
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => onHome?.('home')}
            className="btn-primary w-full py-4 text-base"
          >
            <HomeIcon className="w-5 h-5" />
            Back to Home
          </button>

          {!flagged && (
            <button
              onClick={() => onHome?.('results')}
              className="btn-secondary w-full py-3 text-sm"
            >
              <TrophyIcon className="w-4 h-4" />
              View my results
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}