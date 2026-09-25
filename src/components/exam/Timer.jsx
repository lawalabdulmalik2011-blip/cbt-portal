import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Timer({ durationMinutes, startedAt, onExpire }) {
  const end = new Date(startedAt).getTime() + durationMinutes * 60_000;
  const [left, setLeft] = useState(Math.max(0, end - Date.now()));

  useEffect(() => {
    const i = setInterval(() => {
      const rem = end - Date.now();
      if (rem <= 0) {
        clearInterval(i);
        onExpire?.();
      }
      setLeft(Math.max(0, rem));
    }, 1000);
    return () => clearInterval(i);
  }, [end, onExpire]);

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);

  const danger = left < 60_000;         // < 1 min
  const warning = left < 5 * 60_000;    // < 5 min

  return (
    <motion.div
      animate={danger ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 1, repeat: danger ? Infinity : 0 }}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-mono font-bold text-sm sm:text-base transition ${
        danger
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
          : warning
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span>
        {h > 0 && `${h}:`}
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </motion.div>
  );
}