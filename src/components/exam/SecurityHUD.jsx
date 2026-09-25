import { motion } from 'framer-motion';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function SecurityHUD({ violations, maxViolations }) {
  const danger = violations >= maxViolations - 1;
  const safe = violations === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${
        safe
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : danger
          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      {safe ? (
        <ShieldCheckIcon className="w-4 h-4" />
      ) : (
        <ShieldExclamationIcon className="w-4 h-4" />
      )}
      {safe ? 'Secure' : `${violations} / ${maxViolations} strikes`}
    </motion.div>
  );
}