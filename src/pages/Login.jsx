import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/ui/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSignIn() {
    setBusy(true);
    setError('');
    try {
      await signIn();
    } catch (e) {
      setError(e.message || 'Sign-in failed');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-400/30 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* LEFT — Marketing panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative z-10 p-12">
        <Logo size={40} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg"
        >
          <h1 className="font-display text-5xl font-extrabold leading-[1.1] text-slate-900">
            The future of{' '}
            <span className="text-gradient">online exams</span> is here.
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Secure, lightning-fast, and beautiful. Built for schools that
            refuse to compromise on quality.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4">
            <Feature icon={BoltIcon} title="Blazing fast" desc="Instant question delivery, zero lag" />
            <Feature icon={ShieldCheckIcon} title="Anti-cheat proctoring" desc="Tab-switch detection & fullscreen lock" />
            <Feature icon={ChartBarIcon} title="Real-time analytics" desc="Watch every student live during exams" />
          </div>
        </motion.div>

        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} ExamPro. Built for the next generation.
        </p>
      </div>

      {/* RIGHT — Login card */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md glass rounded-3xl p-8 sm:p-10"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={40} />
          </div>

          <h2 className="font-display text-3xl font-extrabold text-slate-900">
            Welcome back
          </h2>
          <p className="text-slate-500 mt-2">
            Sign in to continue to your dashboard.
          </p>

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="mt-8 w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-2xl py-3.5 px-4 font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-lg hover:shadow-brand-500/10 disabled:opacity-60 transition-all duration-200 active:scale-[0.98]"
          >
            {busy ? (
              <>
                <Spinner size={20} />
                Signing in…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl"
            >
              {error}
            </motion.p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Secure</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-brand-600 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.9 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}