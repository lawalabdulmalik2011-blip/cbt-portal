import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function NotesCard({
  note,
  onClick,
  submitted,
  editable = false,
  onEdit,
  onDelete,
  delay = 0,
  now,
}) {
  const subject = note.subjects;
  const isAssignment = note.type === 'assignment';
  const dueAt = note.due_at ? new Date(note.due_at).getTime() : null;
  const dueIn = dueAt && dueAt > now ? dueAt - now : 0;
  const overdue = dueAt && dueAt <= now;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-5 relative overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {/* Accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isAssignment
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : 'bg-gradient-to-r from-brand-500 to-accent-500'
        }`}
      />

      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            isAssignment
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
              : 'bg-gradient-to-br from-brand-500 to-accent-500 shadow-brand-500/30'
          }`}
        >
          {isAssignment ? (
            <PencilSquareIcon className="w-6 h-6 text-white" />
          ) : (
            <BookOpenIcon className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isAssignment
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-brand-100 text-brand-700'
              }`}
            >
              {isAssignment ? 'Assignment' : 'Note'}
            </span>
            {subject && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${subject.color}20`,
                  color: subject.color,
                }}
              >
                {subject.name}
              </span>
            )}
            {submitted && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                Done
              </span>
            )}
            {isAssignment && dueAt && !submitted && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  overdue
                    ? 'bg-rose-100 text-rose-700'
                    : dueIn < 24 * 3600_000
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <ClockIcon className="w-3 h-3" />
                {overdue ? 'Overdue' : `Due in ${formatDuration(dueIn)}`}
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-slate-900 leading-tight line-clamp-2">
            {note.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {note.content}
          </p>

          <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="w-3 h-3" />
              {new Date(note.created_at).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            {note.profile?.full_name && (
              <span>{note.profile.full_name}</span>
            )}
          </div>
        </div>

        {/* Actions for teacher */}
        {editable && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(note);
              }}
              className="p-2 rounded-lg text-brand-600 hover:bg-brand-50"
              title="Edit"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(note);
              }}
              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}