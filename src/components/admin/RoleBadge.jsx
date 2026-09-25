const STYLES = {
  student: 'bg-brand-100 text-brand-700 ring-brand-200',
  teacher: 'bg-accent-100 text-accent-700 ring-accent-200',
  admin:   'bg-rose-100  text-rose-700  ring-rose-200',
};

const LABELS = {
  student: 'Student',
  teacher: 'Teacher',
  admin:   'Admin',
};

export default function RoleBadge({ role }) {
  const cls = STYLES[role] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cls}`}
    >
      {LABELS[role] ?? role}
    </span>
  );
}