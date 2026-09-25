import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function ViolationBanner({ violation, maxViolations }) {
  return (
    <AnimatePresence>
      {violation && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"
        >
          <div
            className={`rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-lg mx-4 backdrop-blur-xl border-2 ${
              violation.count >= maxViolations
                ? 'bg-rose-50/95 border-rose-300'
                : violation.count === maxViolations - 1
                ? 'bg-orange-50/95 border-orange-300'
                : 'bg-amber-50/95 border-amber-300'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                violation.count >= maxViolations - 1
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            >
              {violation.count >= maxViolations - 1 ? (
                <ShieldExclamationIcon className="w-7 h-7 text-white" />
              ) : (
                <ExclamationTriangleIcon className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-display font-extrabold text-lg ${
                  violation.count >= maxViolations - 1
                    ? 'text-rose-900'
                    : 'text-amber-900'
                }`}
              >
                {violation.count >= maxViolations
                  ? 'Exam locked'
                  : violation.count === maxViolations - 1
                  ? '⚠️ FINAL WARNING'
                  : `Warning ${violation.count} of ${maxViolations - 1}`}
              </p>
              <p
                className={`text-sm ${
                  violation.count >= maxViolations - 1
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {violation.count >= maxViolations
                  ? 'Your exam is being submitted and flagged.'
                  : `Detected: ${formatReason(violation.reason)}. Next violation = auto-submit.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatReason(reason) {
  const map = {
    tab_switch: 'you left the exam tab',
    window_blur: 'the exam window lost focus',
    fullscreen_exit: 'you exited fullscreen',
    right_click: 'right-click detected',
    copy: 'copy attempt',
    cut: 'cut attempt',
    paste: 'paste attempt',
    devtools_attempt: 'developer tools attempt',
    view_source: 'view-source attempt',
    printscreen: 'screenshot attempt',
    print_attempt: 'print attempt',
    save_page: 'save-page attempt',
    ctrl_c: 'copy shortcut',
    ctrl_x: 'cut shortcut',
    ctrl_v: 'paste shortcut',
  };
  return map[reason] ?? reason;
}