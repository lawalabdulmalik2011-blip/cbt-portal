import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  HomeIcon,
  TrophyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function ExamCompletedScreen({
  examTitle,
  score,
  passed,
  submittedAt,
  showScore = true,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center my-8"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.1 }}
          className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-6 ${
            passed
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40'
              : 'bg-gradient-to-br from-brand-500 to-accent-500 shadow-brand-500/40'
          }`}
        >
          <CheckCircleIcon className="w-14 h-14 text-white" />
        </motion.div>

        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Exam Completed
        </h1>

        {examTitle && (
          <p className="text-slate-500 mt-2">
            <span className="font-semibold text-slate-700">{examTitle}</span>
          </p>
        )}

        <p className="text-slate-600 mt-4 leading-relaxed">
          You have already submitted this exam. It cannot be re-entered or
          retaken unless your teacher reopens it for you.
        </p>

        {showScore && score !== null && score !== undefined && (
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
        )}

        {submittedAt && (
          <p className="text-xs text-slate-400 mt-4">
            Submitted on{' '}
            {new Date(submittedAt).toLocaleString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Link to="/student" className="btn-primary w-full py-4 text-base">
            <HomeIcon className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            to="/student/results"
            className="btn-secondary w-full py-3 text-sm"
          >
            <TrophyIcon className="w-4 h-4" />
            View my results
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheckIcon className="w-4 h-4" />
          This attempt is locked and monitored
        </div>
      </motion.div>
    </div>
  );
}