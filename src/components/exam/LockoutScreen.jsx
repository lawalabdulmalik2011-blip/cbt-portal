import { motion } from 'framer-motion';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import Spinner from '../ui/Spinner.jsx';

export default function LockoutScreen({ reason, submitting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-2xl shadow-rose-500/40 mb-6"
        >
          <ShieldExclamationIcon className="w-11 h-11 text-white" />
        </motion.div>

        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Exam Locked
        </h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          You have exceeded the maximum number of security violations
          (<strong>3</strong>). Your exam is being submitted automatically and
          has been flagged for review by your teacher.
        </p>

        <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-rose-600 font-bold mb-1">
            Last violation
          </p>
          <p className="text-sm text-rose-800 font-medium capitalize">
            {String(reason).replace(/_/g, ' ')}
          </p>
        </div>

        {submitting && (
          <div className="mt-6 flex items-center justify-center gap-3 text-slate-500">
            <Spinner size={20} />
            <span className="text-sm font-medium">Submitting your answers…</span>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Do not close this window. You will be redirected shortly.
        </p>
      </motion.div>
    </motion.div>
  );
}