export default function Spinner({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 animate-spin" />
      </div>
    </div>
  );
}

export function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Spinner size={48} />
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}