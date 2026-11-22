// src/pages/TeacherDashboard.jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  PencilSquareIcon,
  UsersIcon,
  PlayCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/ui/TopBar.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import AnnouncementBanner from '../components/announcements/AnnouncementBanner.jsx';

// ---------------------------------------------------------------
// Card catalogue, grouped into sections
// ---------------------------------------------------------------
const SECTIONS = [
  {
    id: 'assess',
    label: 'Create & Assess',
    icon: PencilSquareIcon,
    cards: [
      {
        icon: DocumentTextIcon,
        title: 'Question Bank',
        desc: 'Create and manage questions',
        to: '/teacher/questions',
        tone: 'brand',
        badge: 'Ready',
      },
      {
        icon: PencilSquareIcon,
        title: 'Exams',
        desc: 'Build and publish exams',
        to: '/teacher/exams',
        tone: 'accent',
        badge: 'Ready',
      },
      {
        icon: BookOpenIcon,
        title: 'Notes & Assignments',
        desc: 'Share study material and homework',
        to: '/teacher/notes',
        tone: 'indigo',
        badge: 'Ready',
      },
      {
        icon: ClipboardDocumentCheckIcon,
        title: 'Report Cards',
        desc: 'Create & publish student reports',
        to: '/teacher/reports',
        tone: 'emerald',
        badge: 'Ready',
      },
    ],
  },
  {
    id: 'people',
    label: 'Students & Classes',
    icon: UsersIcon,
    cards: [
      {
        icon: AcademicCapIcon,
        title: 'Classes',
        desc: 'Manage classes and promote students',
        to: '/teacher/classes',
        tone: 'violet',
        badge: 'Ready',
      },
      {
        icon: UserGroupIcon,
        title: 'Manage Students',
        desc: 'Search, reopen exams, view scores',
        to: '/teacher/students',
        tone: 'sky',
        badge: 'Ready',
      },
      {
        icon: UsersIcon,
        title: 'Students & Staff',
        desc: 'Manage your school roster',
        to: '/admin/users',
        tone: 'amber',
        badge: 'Ready',
      },
      {
        icon: CheckCircleIcon,
        title: 'Attendance',
        desc: 'Mark daily attendance',
        to: '/teacher/attendance',
        tone: 'teal',
        badge: 'New',
      },
    ],
  },
  {
    id: 'engage',
    label: 'Communicate & Monitor',
    icon: MegaphoneIcon,
    cards: [
      {
        icon: MegaphoneIcon,
        title: 'Announcements',
        desc: 'Send messages to students',
        to: '/teacher/announcements',
        tone: 'blue',
        badge: 'Ready',
      },
      {
        icon: CalendarDaysIcon,
        title: 'Timetable',
        desc: 'Weekly class schedule',
        to: '/teacher/timetable',
        tone: 'pink',
        badge: 'New',
      },
      {
        icon: PlayCircleIcon,
        title: 'Live Monitor',
        desc: 'Watch students in real time',
        to: '/teacher/exams',
        tone: 'cyan',
        badge: 'Ready',
      },
    ],
  },
];

// tone -> tailwind classes (single source of truth for the grid)
const TONES = {
  brand:   { bg: 'from-brand-500 to-brand-600',     ring: 'ring-brand-500/20',    text: 'text-brand-600' },
  accent:  { bg: 'from-accent-500 to-accent-600',   ring: 'ring-accent-500/20',   text: 'text-accent-600' },
  indigo:  { bg: 'from-indigo-500 to-indigo-600',   ring: 'ring-indigo-500/20',   text: 'text-indigo-600' },
  emerald: { bg: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-500/20',  text: 'text-emerald-600' },
  violet:  { bg: 'from-violet-500 to-violet-600',   ring: 'ring-violet-500/20',   text: 'text-violet-600' },
  sky:     { bg: 'from-sky-500 to-sky-600',         ring: 'ring-sky-500/20',      text: 'text-sky-600' },
  amber:   { bg: 'from-amber-500 to-amber-600',     ring: 'ring-amber-500/20',    text: 'text-amber-600' },
  teal:    { bg: 'from-teal-500 to-teal-600',       ring: 'ring-teal-500/20',     text: 'text-teal-600' },
  blue:    { bg: 'from-blue-500 to-blue-600',       ring: 'ring-blue-500/20',     text: 'text-blue-600' },
  pink:    { bg: 'from-pink-500 to-pink-600',       ring: 'ring-pink-500/20',     text: 'text-pink-600' },
  cyan:    { bg: 'from-cyan-500 to-cyan-600',       ring: 'ring-cyan-500/20',     text: 'text-cyan-600' },
};

const QUICK_ACTIONS = [
  { label: 'Create exam',       to: '/teacher/exams',          icon: PlusIcon },
  { label: 'New announcement',  to: '/teacher/announcements',  icon: MegaphoneIcon },
  { label: 'Mark attendance',   to: '/teacher/attendance',     icon: CheckCircleIcon },
];

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const initials = useMemo(() => {
    const name = profile?.full_name || '';
    const parts = name.split(' ').filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
    return letters || 'T';
  }, [profile?.full_name]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({
        ...s,
        cards: s.cards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.desc.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.cards.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <TopBar variant="teacher" />

      <PageTransition>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          <AnnouncementBanner />

          {/* ================= HERO ================= */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 text-white p-6 sm:p-8 shadow-xl"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur ring-1 ring-white/30 flex items-center justify-center font-display text-2xl font-extrabold">
                {initials}
              </div>

              <div className="flex-1">
                <p className="text-white/70 text-sm">Welcome back</p>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
                  {profile?.full_name?.split(' ')[0] || 'Teacher'}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20">
                    Teacher
                  </span>
                  {profile?.exam_number && (
                    <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 font-mono">
                      {profile.exam_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="relative mt-6 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur ring-1 ring-white/25 px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <a.icon className="w-4 h-4" />
                  {a.label}
                </button>
              ))}
            </div>
          </motion.section>

          {/* ================= SEARCH ================= */}
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to a tool…"
              className="input pl-10"
              type="search"
            />
          </div>

          {/* ================= SECTIONS ================= */}
          <div className="space-y-10">
            {filteredSections.map((section) => (
              <section key={section.id}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="w-5 h-5 text-slate-400" />
                  <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                    {section.label}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {section.cards.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {section.cards.map((c, i) => {
                    const tone = TONES[c.tone] ?? TONES.brand;
                    return (
                      <motion.button
                        key={c.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.04,
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(c.to)}
                        className={`group relative text-left glass rounded-2xl p-5 hover:shadow-lg ring-1 ${tone.ring} transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tone.bg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                          >
                            <c.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {c.badge}
                          </span>
                        </div>

                        <h3 className="mt-3 font-display font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                          {c.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {c.desc}
                        </p>

                        <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition absolute bottom-4 right-4" />
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                No tools match “{query}”.
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}