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
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/ui/TopBar.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import AnnouncementBanner from '../components/announcements/AnnouncementBanner.jsx';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      icon: DocumentTextIcon,
      title: 'Question Bank',
      desc: 'Create and manage questions',
      badge: 'Ready',
      gradient: 'from-brand-500 to-brand-600',
      to: '/teacher/questions',
    },
    {
      icon: PencilSquareIcon,
      title: 'Exams',
      desc: 'Build and publish exams',
      badge: 'Ready',
      gradient: 'from-accent-500 to-accent-600',
      to: '/teacher/exams',
    },
    {
      icon: BookOpenIcon,
      title: 'Notes & Assignments',
      desc: 'Share study material and homework',
      badge: 'Ready',
      gradient: 'from-indigo-500 to-purple-600',
      to: '/teacher/notes',
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Report Cards',
      desc: 'Create & publish student reports',
      badge: 'Ready',
      gradient: 'from-emerald-500 to-teal-600',
      to: '/teacher/reports',
    },
    {
      icon: MegaphoneIcon,
      title: 'Announcements',
      desc: 'Send messages to students',
      badge: 'Ready',
      gradient: 'from-blue-500 to-blue-600',
      to: '/teacher/announcements',
    },
    {
      icon: AcademicCapIcon,
      title: 'Classes',
      desc: 'Manage classes and promote students',
      badge: 'Ready',
      gradient: 'from-violet-500 to-purple-600',
      to: '/teacher/classes',
    },
    {
      icon: CalendarDaysIcon,
      title: 'Timetable',
      desc: 'Weekly class schedule',
      badge: 'New',
      gradient: 'from-pink-500 to-rose-600',
      to: '/teacher/timetable',
    },
    {
      icon: CheckCircleIcon,
      title: 'Attendance',
      desc: 'Mark daily attendance',
      badge: 'New',
      gradient: 'from-teal-500 to-emerald-600',
      to: '/teacher/attendance',
    },
    {
      icon: PlayCircleIcon,
      title: 'Live Monitor',
      desc: 'Watch students in real time',
      badge: 'Ready',
      gradient: 'from-cyan-500 to-blue-600',
      to: '/teacher/exams',
    },
    {
      icon: UserGroupIcon,
      title: 'Manage Students',
      desc: 'Search, reopen exams, view scores',
      badge: 'Ready',
      gradient: 'from-sky-500 to-blue-600',
      to: '/teacher/students',
    },
    {
      icon: UsersIcon,
      title: 'Students & Staff',
      desc: 'Manage your school roster',
      badge: 'Ready',
      gradient: 'from-amber-500 to-orange-600',
      to: '/admin/users',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnnouncementBanner />

          <div className="mb-8">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              Teacher Dashboard
            </h1>
            <p className="text-slate-500 mt-2">
              Welcome, {profile?.full_name?.split(' ')[0]}. Let's build something great.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((c, i) => (
              <motion.button
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(c.to)}
                className="glass rounded-2xl p-6 text-left group cursor-pointer hover:shadow-lg transition"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}
                >
                  <c.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-slate-800 text-sm leading-tight">
                    {c.title}
                  </h3>
                  <span className="badge-info text-[10px] flex-shrink-0">
                    {c.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
              </motion.button>
            ))}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}