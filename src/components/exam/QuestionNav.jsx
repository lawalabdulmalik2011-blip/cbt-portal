import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export default function QuestionNav({
  questions,
  answers,
  flagged,
  current,
  onJump,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== '' && answers[k] !== undefined
  ).length;

  return (
    <>
      {/* ============================================ */}
      {/* DESKTOP — Sidebar (unchanged)                */}
      {/* ============================================ */}
      <div className="hidden lg:block glass rounded-2xl p-5 sticky top-24">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
          Questions
        </p>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {questions.map((q, i) => {
            const answered =
              answers[q.id] !== undefined && answers[q.id] !== '';
            const isFlagged = !!flagged[q.id];
            const isCurrent = i === current;

            return (
              <button
                key={q.id}
                onClick={() => onJump(i)}
                className={`aspect-square rounded-lg text-xs font-bold transition ${
                  isCurrent ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                } ${
                  isFlagged
                    ? 'bg-amber-400 text-white'
                    : answered
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 text-xs">
          <Legend color="bg-emerald-500" label="Answered" />
          <Legend color="bg-amber-400" label="Flagged" />
          <Legend color="bg-slate-100" label="Not answered" />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-700">
              {answeredCount} / {questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE — Floating button + bottom sheet      */}
      {/* ============================================ */}
      <div className="lg:hidden">
        {/* Floating action button */}
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-brand-600 active:bg-brand-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl transition active:scale-95"
          aria-label="Open question navigator"
        >
          <Squares2X2Icon className="w-5 h-5" />
          <span className="text-sm">
            {answeredCount}/{questions.length}
          </span>
        </button>

        {/* Bottom sheet */}
        <AnimatePresence>
          {sheetOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheetOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100">
                  <div>
                    <p className="font-display text-lg font-bold text-slate-900">
                      Questions
                    </p>
                    <p className="text-xs text-slate-500">
                      {answeredCount} of {questions.length} answered
                    </p>
                  </div>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="p-2 rounded-lg text-slate-400 active:bg-slate-100"
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Question grid — scrollable */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="grid grid-cols-6 gap-2 mb-5">
                    {questions.map((q, i) => {
                      const answered =
                        answers[q.id] !== undefined && answers[q.id] !== '';
                      const isFlagged = !!flagged[q.id];
                      const isCurrent = i === current;

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            onJump(i);
                            setSheetOpen(false);
                          }}
                          className={`aspect-square rounded-lg text-sm font-bold transition active:scale-95 ${
                            isCurrent
                              ? 'ring-2 ring-brand-500 ring-offset-1'
                              : ''
                          } ${
                            isFlagged
                              ? 'bg-amber-400 text-white'
                              : answered
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 flex-wrap text-xs pb-2">
                    <Legend color="bg-emerald-500" label="Answered" />
                    <Legend color="bg-amber-400" label="Flagged" />
                    <Legend color="bg-slate-100" label="Not answered" />
                  </div>
                </div>

                {/* Progress footer */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Progress</span>
                    <span className="font-bold text-slate-900">
                      {answeredCount} / {questions.length}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(answeredCount / questions.length) * 100}%`,
                      }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-slate-500">{label}</span>
    </div>
  );
}