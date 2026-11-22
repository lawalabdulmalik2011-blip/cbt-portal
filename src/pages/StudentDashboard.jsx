import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  PlayCircleIcon,
  EyeIcon,
  SparklesIcon,
  BoltIcon,
  StarIcon,
  RocketLaunchIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  // TargetIcon removed to fix the white screen crash
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { listAvailableExamsForStudent, listMyResults } from '../lib/attempts';
import TopBar from '../components/ui/TopBar.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import AnnouncementBanner from '../components/announcements/AnnouncementBanner.jsx';

// ============================================
// SHARED ACCENT THEME MAP
// ============================================
const accentTheme = {
  brand: { iconBg: 'bg-brand-50', iconText: 'text-brand-600', ring: 'ring-brand-100' },
  amber: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', ring: 'ring-amber-100' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', ring: 'ring-emerald-100' },
  rose: { iconBg: 'bg-rose-50', iconText: 'text-rose-600', ring: 'ring-rose-100' },
  slate: { iconBg: 'bg-slate-50', iconText: 'text-slate-600', ring: 'ring-slate-200' },
};

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        console.log('Student Profile:', profile); // DEBUG

        const [examData, resultsData] = await Promise.all([
          listAvailableExamsForStudent(user.id, profile?.class_level),
          listMyResults(user.id),
        ]);

        console.log('Exams returned from DB:', examData); // DEBUG
        console.log('Results returned from DB:', resultsData); // DEBUG

        setExams(examData);
        setResults(resultsData);
      } catch (err) {
        console.error('Dashboard load error:', err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, profile]);

  const stats = useMemo(() => {
    const submitted = results.filter((r) => r.status === 'submitted');
    const avg = submitted.length
      ? Math.round(
          submitted.reduce((s, r) => s + (r.score ?? 0), 0) / submitted.length
        )
      : 0;
    const passed = submitted.filter((r) => r.passed).length;
    const passRate = submitted.length
      ? Math.round((passed / submitted.length) * 100)
      : 0;

    let streak = 0;
    for (const r of submitted) {
      if (r.passed) streak++;
      else break;
    }

    const bestScore = submitted.length
      ? Math.max(...submitted.map((r) => r.score ?? 0))
      : 0;

    return {
      avg,
      passed,
      passRate,
      totalTaken: submitted.length,
      streak,
      bestScore,
    };
  }, [results]);

  const subjectStats = useMemo(() => {
    const map = new Map();
    results
      .filter((r) => r.status === 'submitted')
      .forEach((r) => {
        const subject = r.exams?.subjects;
        if (!subject) return;
        const key = subject.name;
        if (!map.has(key)) {
          map.set(key, {
            name: subject.name,
            color: subject.color,
            scores: [],
          });
        }
        map.get(key).scores.push(r.score ?? 0);
      });

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        avg: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
        count: s.scores.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [results]);

  const achievements = useMemo(() => {
    const list = [];
    if (stats.totalTaken >= 1)
      list.push({ icon: RocketLaunchIcon, label: 'First Exam Completed', color: 'from-brand-500 to-brand-600' });
    if (stats.passed >= 1)
      list.push({ icon: CheckCircleIcon, label: 'First Pass', color: 'from-emerald-500 to-teal-600' });
    if (stats.bestScore >= 80)
      list.push({ icon: StarIcon, label: 'High Distinction (80%+)', color: 'from-amber-500 to-orange-600' });
    if (stats.bestScore === 100)
      list.push({ icon: TrophyIcon, label: 'Perfect Score', color: 'from-rose-500 to-pink-600' });
    if (stats.streak >= 3)
      list.push({ icon: FireIcon, label: `${stats.streak} Consecutive Passes`, color: 'from-orange-500 to-red-600' });
    return list;
  }, [stats]);

  const { pending, inProgress, completed, upcoming } = useMemo(() => {
    const pending = [];
    const inProgress = [];
    const completed = [];
    const upcoming = [];

    for (const e of exams) {
      const a = e.attempt;
      const startsInFuture =
        e.start_at && new Date(e.start_at).getTime() > now;

      if (!a && startsInFuture) upcoming.push(e);
      else if (!a) pending.push(e);
      else if (a.status === 'in_progress') inProgress.push(e);
      else if (a.status === 'submitted') completed.push(e);
    }

    upcoming.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );

    return { pending, inProgress, completed, upcoming };
  }, [exams, now]);

  const recent = useMemo(
    () =>
      results
        .filter((r) => r.status === 'submitted')
        .sort(
          (a, b) =>
            new Date(b.submitted_at ?? 0).getTime() -
            new Date(a.submitted_at ?? 0).getTime()
        )
        .slice(0, 3),
    [results]
  );

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="student" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">
          
          <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
          
          <AnnouncementBanner />

          {/* ============================================ */}
          {/* HERO SECTION — refined visual hierarchy       */}
          {/* ============================================ */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-brand-800 to-brand-600 shadow-2xl shadow-brand-900/20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-400/20 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
            </div>

            <div className="relative p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="text-white flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-6">
                    {profile?.photo_url ? (
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/30 ring-offset-2 ring-offset-brand-800 shadow-xl flex-shrink-0">
                        <img
                          src={profile.photo_url}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-white/30 ring-offset-2 ring-offset-brand-800 shadow-xl flex-shrink-0">
                        {firstName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
                        {greeting}
                      </p>
                      <p className="font-display text-2xl font-bold tracking-tight">
                        {firstName}
                      </p>
                      <p className="text-[11px] text-white/50 font-mono mt-0.5">
                        ID: {profile?.exam_number}
                      </p>
                    </div>
                  </div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent motion-reduce:transform-none"
                  >
                    {getHeroTitle(pending.length + inProgress.length)}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-3 text-white/70 max-w-lg text-sm leading-relaxed motion-reduce:transform-none"
                  >
                    {pending.length + inProgress.length > 0
                      ? `You have ${pending.length + inProgress.length} assessment${
                          pending.length + inProgress.length === 1 ? '' : 's'
                        } requiring your attention.`
                      : 'There are currently no pending assessments assigned to your profile.'}
                  </motion.p>

                  <div className="flex items-center gap-3 mt-8 flex-wrap">
                    <Link
                      to="/student/notes"
                      className="group inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 hover:border-white/40"
                    >
                      <BookOpenIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Study Materials
                    </Link>
                    <Link
                      to="/student/reports"
                      className="group inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 hover:border-white/40"
                    >
                      <ClipboardDocumentCheckIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Report Cards
                    </Link>
                    <Link
                      to="/student/results"
                      className="group inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 hover:border-white/40"
                    >
                      <TrophyIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Exam Results
                    </Link>
                    {inProgress.length > 0 && (
                      <Link
                        to={`/exam/${inProgress[0].id}`}
                        className="group inline-flex items-center gap-2 bg-white text-brand-800 text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02] transition-all"
                      >
                        <PlayCircleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        Resume Assessment
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-end">
                  <BigProgressRing
                    score={stats.avg}
                    total={stats.totalTaken}
                    passRate={stats.passRate}
                  />
                </div>
              </div>

              {achievements.length > 0 && (
                <div className="relative mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-amber-300" />
                    <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold">
                      Academic Achievements
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {achievements.map((a, i) => {
                      const AchievementIcon = a.icon;
                      return (
                        <motion.div
                          key={a.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium backdrop-blur-sm transition-all cursor-default motion-reduce:transform-none"
                        >
                          <AchievementIcon className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:scale-110" />
                          {a.label}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* STAT CARDS                                    */}
          {/* ============================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={DocumentTextIcon}
              label="Available Exams"
              value={pending.length}
              trend={pending.length > 0 ? 'Action required' : 'None available'}
              color="brand"
              delay={0}
            />
            <StatCard
              icon={BoltIcon}
              label="In Progress"
              value={inProgress.length}
              trend={inProgress.length > 0 ? 'Resume now' : 'None active'}
              color="amber"
              delay={0.05}
              pulse={inProgress.length > 0}
            />
            <StatCard
              icon={ChartBarIcon}
              label="Average Score"
              value={stats.totalTaken > 0 ? `${stats.avg}%` : '—'}
              trend={
                stats.avg >= 70
                  ? 'Excellent standing'
                  : stats.avg >= 50
                  ? 'Satisfactory standing'
                  : stats.totalTaken > 0
                  ? 'Needs improvement'
                  : 'Awaiting results'
              }
              color="emerald"
              delay={0.1}
            />
            <StatCard
              icon={FireIcon}
              label="Pass Streak"
              value={stats.streak}
              trend={stats.streak > 0 ? 'Consistent performance' : 'No active streak'}
              color="rose"
              delay={0.15}
            />
          </div>

          {/* ============================================ */}
          {/* MAIN GRID                                     */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {inProgress.length > 0 && (
                <div>
                  <SectionHeader
                    icon={BoltIcon}
                    title="In Progress"
                    subtitle="Assessments awaiting completion"
                    accent="amber"
                    count={inProgress.length}
                  />
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {inProgress.map((e, i) => (
                      <ExamCard
                        key={e.id}
                        exam={e}
                        status="in_progress"
                        delay={i * 0.05}
                        now={now}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pending.length > 0 && (
                <div>
                  <SectionHeader
                    icon={SparklesIcon}
                    title="Available Assessments"
                    subtitle={`${pending.length} exam${
                      pending.length === 1 ? '' : 's'
                    } currently open`}
                    accent="brand"
                    count={pending.length}
                  />
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {pending.map((e, i) => (
                      <ExamCard
                        key={e.id}
                        exam={e}
                        status="pending"
                        delay={i * 0.05}
                        now={now}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div>
                  <SectionHeader
                    icon={CheckCircleIcon}
                    title="Completed"
                    subtitle="Your recent submissions"
                    accent="emerald"
                    count={completed.length}
                  />
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {completed.map((e, i) => (
                      <ExamCard
                        key={e.id}
                        exam={e}
                        status="completed"
                        delay={i * 0.05}
                        now={now}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!loading && exams.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm overflow-hidden motion-reduce:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-5 border border-slate-200 shadow-sm">
                      <AcademicCapIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-800">
                      No assigned assessments
                    </h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
                      When an examination is published for your class level, it will appear in this list.
                    </p>
                    <Link
                      to="/student/notes"
                      className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      Browse study materials in the meantime
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {loading && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse"
                      >
                        <div className="flex justify-between">
                          <div className="h-3 w-20 bg-slate-200 rounded" />
                          <div className="h-9 w-9 bg-slate-200 rounded-xl" />
                        </div>
                        <div className="h-8 w-16 bg-slate-200 rounded mt-3" />
                        <div className="h-2 w-24 bg-slate-100 rounded mt-2" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse flex gap-4"
                      >
                        <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-slate-200 rounded" />
                          <div className="h-4 w-2/3 bg-slate-200 rounded" />
                          <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        </div>
                        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {upcoming.length > 0 && (
                <UpcomingCard upcoming={upcoming} now={now} />
              )}
              {recent.length > 0 && <RecentActivityCard recent={recent} />}
              {subjectStats.length > 0 && (
                <SubjectPerformanceCard subjects={subjectStats} />
              )}
              <QuickLinksCard />
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function BigProgressRing({ score, total, passRate }) {
  const radius = 60;
  const innerRadius = 48;
  const circumference = 2 * Math.PI * radius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const offset = circumference - (score / 100) * circumference;
  const innerOffset = innerCircumference - (passRate / 100) * innerCircumference;

  return (
    <div className="relative w-44 h-44 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="7"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="7"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
        <circle
          cx="70"
          cy="70"
          r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="4"
          strokeDasharray={innerCircumference}
          initial={{ strokeDashoffset: innerCircumference }}
          animate={{ strokeDashoffset: innerOffset }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">
          Average
        </p>
        <p className="font-display text-4xl font-extrabold leading-none mt-1 tabular-nums">
          {total > 0 ? `${score}%` : '—'}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-white/60">{total} taken</span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
          <span className="text-[10px] text-emerald-300 font-semibold">
            {passRate}% pass
          </span>
        </div>
      </div>
    </div>
  );
}

const colorMap = {
  brand: 'from-brand-500 to-brand-600',
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600',
  rose: 'from-rose-500 to-red-600',
};

function StatCard({ icon: Icon, label, value, trend, color, delay = 0, pulse = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all overflow-hidden motion-reduce:transform-none"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorMap[color]} opacity-60`} />

      {pulse && (
        <span className="absolute top-4 right-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        </span>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="font-display text-3xl font-extrabold text-slate-900 mt-3 tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-1.5 font-medium">{trend}</div>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, accent = 'brand', count }) {
  const a = accentTheme[accent] ?? accentTheme.brand;
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center ring-1 ${a.ring}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span
              className={`text-xs font-bold ${a.iconText} ${a.iconBg} px-2 py-0.5 rounded-full tabular-nums`}
            >
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function ExamCard({ exam, status, delay = 0, now }) {
  const subject = exam.subjects;
  const attempt = exam.attempt;

  const startTime = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const endTime = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const startsIn = startTime && startTime > now ? startTime - now : 0;
  const endsIn = endTime && endTime > now ? endTime - now : 0;
  const hasStarted = !startTime || startTime <= now;
  const hasEnded = endTime && endTime <= now;

  const score = attempt?.score ?? 0;
  const passed = attempt?.passed;
  const isUrgent =
    status === 'pending' && hasStarted && endsIn > 0 && endsIn < 3600_000;

  const subjectColor = subject?.color || '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: '0 12px 30px -10px rgba(0,0,0,0.08)' }}
      className={`group relative bg-white border rounded-2xl p-5 transition-all overflow-hidden motion-reduce:transform-none ${
        isUrgent
          ? 'border-rose-200 ring-1 ring-rose-100 shadow-sm'
          : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div
        className="absolute top-0 left-0 bottom-0 w-1.5"
        style={{
          background: `linear-gradient(180deg, ${subjectColor}, ${subjectColor}55)`,
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pl-2">
        
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {status === 'completed' ? (
              <ProgressRing score={score} passed={passed} />
            ) : (
              <div 
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                style={{ backgroundColor: `${subjectColor}12`, border: `1px solid ${subjectColor}25` }}
              >
                <DocumentTextIcon className="w-6 h-6" style={{ color: subjectColor }} />
                {isUrgent && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {subject && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: `${subjectColor}12`,
                    color: subjectColor,
                  }}
                >
                  {subject.name}
                </span>
              )}
              {status === 'in_progress' && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                  In Progress
                </span>
              )}
              {status === 'completed' && (
                <span
                  className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    passed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  {passed ? 'Passed' : 'Failed'} · {score}%
                </span>
              )}
              {status === 'pending' && !hasStarted && startsIn > 0 && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  <CalendarDaysIcon className="w-3 h-3 mr-1" />
                  Opens in {formatDuration(startsIn)}
                </span>
              )}
            </div>

            <h3 className="font-display font-bold text-slate-900 text-lg leading-tight group-hover:text-brand-700 transition-colors truncate">
              {exam.title}
            </h3>

            {/* Replaced TargetIcon with CheckCircleIcon */}
            <div className="flex items-center gap-4 mt-2.5 text-[13px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                {exam.duration_minutes} mins
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5">
                <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                {exam.question_count} questions
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-slate-400" />
                Pass: {exam.pass_mark}%
              </span>
            </div>

            {isUrgent && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-1.5 font-bold border border-rose-200">
                <ClockIcon className="w-4 h-4 animate-pulse" />
                Closing in: {formatDuration(endsIn)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
          {status === 'pending' && hasEnded ? (
            <button
              disabled
              className="w-full sm:w-auto text-sm px-6 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold cursor-not-allowed border border-slate-200"
            >
              Closed
            </button>
          ) : status === 'pending' && !hasStarted ? (
            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                Scheduled
              </p>
              <p className="text-sm font-mono text-slate-700 font-medium">
                {new Date(exam.start_at).toLocaleString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ) : status === 'pending' ? (
            <Link
              to={`/exam/${exam.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:shadow-brand-500/20 transition-all active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Start Exam
            </Link>
          ) : status === 'in_progress' ? (
            <Link
              to={`/exam/${exam.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:shadow-amber-500/20 transition-all active:scale-95"
            >
              <BoltIcon className="w-5 h-5" />
              Resume Now
            </Link>
          ) : (
            <Link
              to="/student/results"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <EyeIcon className="w-5 h-5" />
              Review
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRing({ score, passed }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = passed ? '#10b981' : '#f43f5e';

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-slate-900 text-xs tabular-nums">
          {score}%
        </span>
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR CARDS — unified shell
// ============================================
function SidebarCard({ icon: Icon, title, subtitle, accent = 'brand', delay = 0, children }) {
  const a = accentTheme[accent] ?? accentTheme.brand;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow motion-reduce:transform-none"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-9 h-9 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function UpcomingCard({ upcoming, now }) {
  return (
    <SidebarCard
      icon={CalendarDaysIcon}
      title="Upcoming Schedule"
      subtitle={`${upcoming.length} scheduled assessment${upcoming.length === 1 ? '' : 's'}`}
      accent="brand"
    >
      <div className="space-y-3">
        {upcoming.slice(0, 4).map((e) => {
          const startsIn = new Date(e.start_at).getTime() - now;
          return (
            <div
              key={e.id}
              className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: e.subjects?.color ?? '#6366f1' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {e.title}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {new Date(e.start_at).toLocaleString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-[11px] text-brand-600 font-bold mt-0.5">
                  Starts in {formatDuration(startsIn)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SidebarCard>
  );
}

function RecentActivityCard({ recent }) {
  return (
    <SidebarCard
      icon={ChartBarIcon}
      title="Recent Submissions"
      subtitle="Your latest results"
      accent="emerald"
      delay={0.1}
    >
      <div className="space-y-3">
        {recent.map((r) => {
          const subject = r.exams?.subjects;
          return (
            <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors -mx-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                  r.passed
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {r.passed ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-bold">F</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {r.exams?.title ?? 'Untitled exam'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {subject?.name} · {r.submitted_at ? timeAgo(new Date(r.submitted_at)) : 'recently'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`font-display font-extrabold text-sm tabular-nums ${
                    r.passed ? 'text-emerald-600' : 'text-slate-700'
                  }`}
                >
                  {r.score ?? 0}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SidebarCard>
  );
}

function SubjectPerformanceCard({ subjects }) {
  return (
    <SidebarCard
      icon={BookOpenIcon}
      title="Subject Performance"
      subtitle="Highest averages"
      accent="amber"
      delay={0.2}
    >
      <div className="space-y-4 mt-2">
        {subjects.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-slate-700 truncate">
                {s.name}
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                {s.avg}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(s.avg, 2)}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${s.color || '#6366f1'}, ${s.color || '#6366f1'}bb)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

function QuickLinksCard() {
  return (
    <SidebarCard
      icon={StarIcon}
      title="Portal Resources"
      subtitle="Quick navigation"
      accent="slate"
      delay={0.3}
    >
      <div className="space-y-1">
        <QuickLink to="/student/notes" icon={BookOpenIcon} label="Study Materials" />
        <QuickLink to="/student/reports" icon={ClipboardDocumentCheckIcon} label="Report Cards" />
        <QuickLink to="/student/results" icon={TrophyIcon} label="Exam Results" />
        <QuickLink to="/student" icon={AcademicCapIcon} label="Main Dashboard" />
      </div>
    </SidebarCard>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition group"
    >
      <div className="w-7 h-7 rounded-md bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition border border-slate-100">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700 transition flex-1">
        {label}
      </span>
      <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}

// ============================================
// UTILS
// ============================================
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function getHeroTitle(pendingCount) {
  if (pendingCount === 0) return "You're up to date.";
  if (pendingCount === 1) return '1 assessment requires attention';
  return `${pendingCount} assessments require attention`;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}