import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function OfflineBanner({ online, queuedCount = 0, syncing = false }) {
  const show = !online || queuedCount > 0 || syncing;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 22 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
          <div
            className={`mt-2 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold ${
              !online
                ? 'bg-amber-500 text-white'
                : syncing
                ? 'bg-brand-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {!online ? (
              <>
                <WifiIcon className="w-4 h-4" />
                Offline — answers saved locally
                {queuedCount > 0 && (
                  <span className="ml-1 bg-white/25 px-1.5 py-0.5 rounded-full">
                    {queuedCount}
                  </span>
                )}
              </>
            ) : syncing ? (
              <>
                <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />
                Syncing {queuedCount} answer{queuedCount === 1 ? '' : 's'}…
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                All answers synced
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}