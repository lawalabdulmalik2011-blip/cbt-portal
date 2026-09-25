import { useEffect, useState } from 'react';

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
  const danger = left < 60_000;
  const warning = left < 5 * 60_000;

  return (
    <div
      className={`text-2xl font-mono font-bold px-5 py-2.5 rounded-xl transition ${
        danger
          ? 'bg-rose-100 text-rose-700 animate-pulse'
          : warning
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      ⏱ {h > 0 && `${h}:`}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}QuestionCard.jsx