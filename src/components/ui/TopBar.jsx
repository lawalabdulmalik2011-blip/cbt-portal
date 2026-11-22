import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TopBar({ variant = 'student' }) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? '?';
  const hasPhoto = !!profile?.photo_url;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <img 
            src="/kaztal-logo.png" 
            alt="Kaztal Academy CBT" 
            className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-slate-200" 
          />
          <div className="hidden sm:flex flex-col justify-center">
            <span className="font-display font-extrabold text-slate-900 leading-tight tracking-tight text-sm">
              Kaztal Academy
            </span>
            <span className="text-[10px] font-bold text-brand-600 tracking-wider">
              CBT PORTAL
            </span>
          </div>
          {variant === 'teacher' && <span className="badge-info ml-1">Teacher</span>}
          {variant === 'admin' && <span className="badge-danger ml-1">Admin</span>}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {profile?.full_name?.split(' ')[0] ?? 'User'}
            </span>

            {/* Avatar — shows photo or initials */}
            {hasPhoto ? (
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-500 ring-offset-1 bg-slate-100 flex-shrink-0">
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white flex-shrink-0">
                {initial}
              </div>
            )}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20"
                >
                  {/* User info with photo */}
                  <div className="px-3 py-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                    {hasPhoto ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={profile.photo_url}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-mono">
                        {profile?.exam_number}
                      </p>
                    </div>
                  </div>

                  <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}