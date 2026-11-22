import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [examNumber, setExamNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!examNumber.trim() || !password) {
      setError('Please enter both exam number and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(examNumber, password);
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen relative flex overflow-hidden bg-slate-900">
      
      {/* ============================================ */}
      {/* FULLSCREEN BACKGROUND IMAGE                  */}
      {/* ============================================ */}
      <img 
        src="/kaztal-bg.png" 
        alt="Kaztal Academy" 
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
        style={{ 
          filter: "blur(3px) brightness(0.5)" 
        }}
      />

      {/* ============================================ */}
      {/* PREMIUM GRADIENT OVERLAY                     */}
      {/* ============================================ */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/30" />

      {/* ============================================ */}
      {/* LEFT — Marketing                             */}
      {/* ============================================ */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative z-10 p-12">
        <div className="flex items-center gap-4">
          <img 
            src="/kaztal-logo.png" 
            alt="Kaztal Academy CBT" 
            className="w-14 h-14 rounded-full object-cover shadow-xl ring-1 ring-white/30" 
          />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-white text-2xl tracking-tight leading-none drop-shadow-lg">
              Kaztal Academy
            </span>
            <span className="text-sm font-bold text-brand-300 tracking-widest mt-1 drop-shadow-md">
              CBT PORTAL
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <h1 className="font-display text-5xl font-extrabold leading-[1.1] text-white drop-shadow-xl">
            Sign in to your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-300">
              CBT Portal
            </span>.
          </h1>
          <p className="mt-6 text-lg text-slate-300 leading-relaxed drop-shadow-lg">
            Access your academic assessments seamlessly. No email required—simply 
            authenticate using your official examination number and secure password.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4">
            <Feature
              icon={BoltIcon}
              title="Immediate Authentication"
              desc="Direct access to your dashboard with zero verification delays."
            />
            <Feature
              icon={ShieldCheckIcon}
              title="Advanced Proctoring"
              desc="Monitored environment with focus-loss detection and secure fullscreen locks."
            />
            <Feature
              icon={ChartBarIcon}
              title="Comprehensive Analytics"
              desc="Real-time performance tracking and live monitoring for administrators."
            />
          </div>
        </motion.div>

        <p className="text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Kaztal Academy CBT. All rights reserved.
        </p>
      </div>

      {/* ============================================ */}
      {/* RIGHT — Login form                           */}
      {/* ============================================ */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center gap-3 text-center">
            <img 
              src="/kaztal-logo.png" 
              alt="Kaztal Academy CBT" 
              className="w-16 h-16 rounded-full object-cover shadow-sm ring-1 ring-slate-200" 
            />
            <div className="flex flex-col items-center">
              <span className="font-display font-extrabold text-slate-900 text-xl tracking-tight leading-none">
                Kaztal Academy
              </span>
              <span className="text-xs font-bold text-brand-600 tracking-widest mt-1">
                CBT PORTAL
              </span>
            </div>
          </div>

          <h2 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
            Secure Sign In
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Please enter your credentials to proceed.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Examination Number
              </label>
              <input
                type="text"
                value={examNumber}
                onChange={(e) => setExamNumber(e.target.value)}
                placeholder="e.g. STU/2025/001"
                autoComplete="username"
                className="input font-mono tracking-wide bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Accepted formats: <span className="font-mono text-slate-600">STU/...</span> · <span className="font-mono text-slate-600">TCH/...</span> · <span className="font-mono text-slate-600">ADM/...</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input pr-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full shadow-lg shadow-brand-500/30 font-semibold text-base py-2.5 mt-2"
            >
              {busy ? (
                <>
                  <Spinner size={20} />
                  Authenticating…
                </>
              ) : (
                'Access Portal'
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Secure Connection
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="mt-6 text-xs text-slate-500 text-center leading-relaxed font-medium">
            Having trouble signing in? Please contact the Kaztal Academy IT Administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Extracted Feature component with glassmorphism
function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg transition-all hover:bg-white/10 hover:-translate-y-0.5 cursor-default">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-white tracking-wide">{title}</p>
        <p className="text-sm text-slate-300 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}