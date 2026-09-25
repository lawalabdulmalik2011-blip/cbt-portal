import { motion } from 'framer-motion';

export default function Logo({ size = 36, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="relative"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl rotate-6" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="m9 10 2 2 4-4" />
          </svg>
        </div>
      </motion.div>
      {showText && (
        <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
          Exam<span className="text-gradient">Pro</span>
        </span>
      )}
    </div>
  );
}