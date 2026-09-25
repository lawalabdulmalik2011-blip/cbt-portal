import { motion } from 'framer-motion';
import { ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';

export default function EnterFullscreenGate({ exam, onEnter, starting }) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg w-full"
      >
        <div className="rounded-3xl p-8 text-center bg-white/95 backdrop-blur-xl shadow-2xl">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-brand-500/40 mb-6"
          >
            <ShieldCheckIcon className="w-11 h-11 text-white" />
          </motion.div>

          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Secure Exam Room
          </h1>
          <p className="text-slate-500 mt-2">
            <span className="font-semibold">{exam?.title}</span>
          </p>

          <div className="mt-6 p-5 bg-slate-50 rounded-2xl text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
              Before you begin
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </span>
                The exam will open in <strong>fullscreen mode</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </span>
                <span>
                  Do <strong>NOT</strong> leave the tab, exit fullscreen, or use
                  keyboard shortcuts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </span>
                <span>
                  You have <strong>3 strikes</strong>. Every violation is logged
                  and will <strong>auto-submit and flag your exam</strong>
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={onEnter}
            disabled={starting}
            className="btn-primary w-full mt-6 py-4 text-base"
          >
            {starting ? (
              'Preparing…'
            ) : (
              <>
                <BoltIcon className="w-5 h-5" />
                Enter Exam Room
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-4">
            By entering you agree to the exam rules above.
          </p>
        </div>
      </motion.div>
    </div>
  );
}