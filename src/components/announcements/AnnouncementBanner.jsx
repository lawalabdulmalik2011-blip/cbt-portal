import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MegaphoneIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyAnnouncements } from '../../lib/announcements';

const PRIORITY_STYLE = {
  info: {
    bg: 'from-blue-500 to-blue-600',
    text: 'text-white',
  },
  warning: {
    bg: 'from-amber-500 to-orange-600',
    text: 'text-white',
  },
  urgent: {
    bg: 'from-rose-500 to-red-600',
    text: 'text-white',
  },
};

export default function AnnouncementBanner() {
  const { profile, role } = useAuth();
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed-announcements') || '[]');
    } catch {
      return [];
    }
  });
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!role) return;
    getMyAnnouncements({ role, classLevel: profile?.class_level })
      .then(setItems)
      .catch(() => {});
  }, [role, profile]);

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed-announcements', JSON.stringify(next));
  }

  const visible = items.filter((a) => !dismissed.includes(a.id)).slice(0, 5);

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visible.map((a) => {
          const style = PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE.info;
          const isExpanded = expanded === a.id;

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r ${style.bg} ${style.text}`}
            >
              <div className="flex items-start gap-3 p-4">
                <MegaphoneIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {a.title}
                  </p>
                  {isExpanded ? (
                    <p className="text-sm mt-2 text-white/90 leading-relaxed whitespace-pre-wrap">
                      {a.content}
                    </p>
                  ) : (
                    <p className="text-xs text-white/80 mt-1 line-clamp-1">
                      {a.content}
                    </p>
                  )}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : a.id)}
                    className="text-[11px] font-semibold mt-1.5 opacity-90 hover:opacity-100 flex items-center gap-1"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                    <ChevronDownIcon
                      className={`w-3 h-3 transition ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => dismiss(a.id)}
                  className="p-1 rounded-lg hover:bg-white/20 transition flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}