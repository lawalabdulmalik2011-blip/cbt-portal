import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function StudentSearchBar({ value, onChange, onSubmit, loading }) {
  return (
    <div className="glass rounded-2xl p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search by student name or exam number…"
            className="input pl-12 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      <p className="text-xs text-slate-400 mt-2">
        Try: <span className="font-mono">Fareed</span> ·{' '}
        <span className="font-mono">STU/2026</span> · a full name
      </p>
    </div>
  );
}