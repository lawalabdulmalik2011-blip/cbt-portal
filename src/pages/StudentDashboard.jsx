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
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { listAvailableExamsForStudent, listMyResults } from '../lib/attempts';
import TopBar from '../components/ui/TopBar.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import AnnouncementBanner from '../components/announcements/AnnouncementBanner.jsx';

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
        const [examData, resultsData] = await Promise.all([
          listAvailableExamsForStudent(user.id, profile?.class_level),
          listMyResults(user.id),
        ]);
        setExams(examData);
        setResults(resultsData);
      } catch (err) {
        console.error(err);
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
      list.push({ icon: RocketLaunchIcon, label: 'First exam', color: 'from-brand-500 to-brand-600' });
    if (stats.passed >= 1)
      list.push({ icon: CheckCircleIcon, label: 'First pass', color: 'from-emerald-500 to-teal-600' });
    if (stats.bestScore >= 80)
      list.push({ icon: StarIcon, label: '80%+ score', color: 'from-amber-500 to-orange-600' });
    if (stats.bestScore === 100)
      list.push({ icon: TrophyIcon, label: 'Perfect score', color: 'from-rose-500 to-pink-600' });
    if (stats.streak >= 3)
      list.push({ icon: FireIcon, label: `${stats.streak}-streak`, color: 'from-orange-500 to-red-600' });
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
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Announcement banner */}
          <AnnouncementBanner />

          {/* HERO */}
          <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-brand-600 via-accent-600 to-pink-600">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="text-white flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                  {profile?.photo_url ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 bg-white/10 flex-shrink-0">
                      <img
                        src={profile.photo_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/20 flex-shrink-0">
                      {firstName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs uppercase tracking-wider font-semibold">
                      {greeting}
                    </p>
                    <p className="font-display text-2xl font-extrabold">
                      {firstName}
                    </p>
                    <p className="text-xs text-white/60 font-mono">
                      {profile?.exam_number}
                    </p>
                  </div>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="font-display text-4xl sm:text-5xl font-extrabold leading-tight"
                >
                  {getHeroTitle(pending.length + inProgress.length)}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 text-white/80 max-w-lg"
                >
                  {pending.length + inProgress.length > 0
                    ? `You have ${pending.length + inProgress.length} exam${
                        pending.length + inProgress.length === 1 ? '' : 's'
                      } waiting. Let's make this count!`
                    : 'All caught up! Check back for new exams.'}
                </motion.p>

                <div className="flex items-center gap-3 mt-6 flex-wrap">
                  <Link
                    to="/student/notes"
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition text-white font-semibold px-5 py-3 rounded-xl border border-white/20"
                  >
                    <BookOpenIcon className="w-5 h-5" />
                    Notes & Assignments
                  </Link>
                  <Link
                    to="/student/reports"
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition text-white font-semibold px-5 py-3 rounded-xl border border-white/20"
                  >
                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    Report cards
                  </Link>
                  <Link
                    to="/student/results"
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition text-white font-semibold px-5 py-3 rounded-xl border border-white/20"
                  >
                    <TrophyIcon className="w-5 h-5" />
                    My results
                  </Link>
                  {inProgress.length > 0 && (
                    <Link
                      to={`/exam/${inProgress[0].id}`}
                      className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-5 py-3 rounded-xl hover:shadow-2xl transition"
                    >
                      <PlayCircleIcon className="w-5 h-5" />
                      Resume exam
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 lg:flex-shrink-0">
                <BigProgressRing
                  score={stats.avg}
                  total={stats.totalTaken}
                  passRate={stats.passRate}
                />
              </div>
            </div>

            {achievements.length > 0 && (
              <div className="relative mt-6 pt-6 border-t border-white/15">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-4 h-4 text-white/80" />
                  <p className="text-white/80 text-xs uppercase tracking-wider font-semibold">
                    Achievements
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {achievements.map((a, i) => (
                    <motion.div
                      key={a.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${a.color} text-white text-xs font-semibold shadow-lg`}
                    >
                      <a.icon className="w-3.5 h-3.5" />
                      {a.label}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={DocumentTextIcon}
              label="Available Exams"
              value={pending.length}
              trend={pending.length > 0 ? 'Ready to start' : 'All caught up'}
              color="brand"
              delay={0}
            />
            <StatCard
              icon={BoltIcon}
              label="In Progress"
              value={inProgress.length}
              trend={inProgress.length > 0 ? 'Continue now' : 'Nothing pending'}
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
                  ? 'Excellent'
                  : stats.avg >= 50
                  ? 'Good'
                  : stats.totalTaken > 0
                  ? 'Keep going'
                  : 'Not enough data'
              }
              color="emerald"
              delay={0.1}
            />
            <StatCard
              icon={FireIcon}
              label="Current Streak"
              value={stats.streak}
              trend={stats.streak > 0 ? 'On fire!' : 'Start one!'}
              color="rose"
              delay={0.15}
            />
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {inProgress.length > 0 && (
                <div>
                  <SectionHeader
                    icon={BoltIcon}
                    title="In progress"
                    subtitle="Pick up where you left off"
                    accent="amber"
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
                    title="Available now"
                    subtitle={`${pending.length} exam${
                      pending.length === 1 ? '' : 's'
                    } ready to take`}
                    accent="brand"
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
                    subtitle="Your finished exams"
                    accent="emerald"
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
                  className="glass rounded-3xl p-16 text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/30">
                    <AcademicCapIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-800">
                    No exams assigned yet
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    When your teacher publishes an exam for your class, it'll
                    appear right here.
                  </p>
                </motion.div>
              )}

              {loading && (
                <div className="grid grid-cols-1 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-40 rounded-2xl" />
                  ))}
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
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 lg:w-44 lg:h-44 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="10"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">
          Average
        </p>
        <p className="font-display text-4xl font-extrabold leading-none mt-1">
          {total > 0 ? `${score}%` : '—'}
        </p>
        <p className="text-[10px] text-white/70 mt-1">
          {total} exam{total === 1 ? '' : 's'}
        </p>
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
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-5 cursor-default relative overflow-hidden"
    >
      {pulse && (
        <span className="absolute top-3 right-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="font-display text-3xl font-extrabold text-slate-900 mt-3">
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1">{trend}</div>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, accent = 'brand' }) {
  const accentColor = {
    brand: 'text-brand-600 bg-brand-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  }[accent];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl ${accentColor} flex items-center justify-center`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-5 relative overflow-hidden group"
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: subject?.color
            ? `linear-gradient(90deg, ${subject.color}, ${subject.color}88)`
            : 'linear-gradient(90deg, #6366f1, #a855f7)',
        }}
      />

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {status === 'completed' ? (
            <ProgressRing score={score} passed={passed} />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <DocumentTextIcon className="w-7 h-7 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {subject && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${subject.color}18`,
                  color: subject.color,
                }}
              >
                {subject.name}
              </span>
            )}
            {status === 'in_progress' && (
              <span className="badge bg-amber-100 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse" />
                In progress
              </span>
            )}
            {status === 'completed' && (
              <span
                className={`badge ${
                  passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <CheckCircleIcon className="w-3 h-3" />
                {passed ? 'Passed' : 'Failed'} · {score}%
              </span>
            )}
            {status === 'pending' && !hasStarted && startsIn > 0 && (
              <span className="badge bg-brand-100 text-brand-700">
                <CalendarDaysIcon className="w-3 h-3" />
                Starts in {formatDuration(startsIn)}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">
            {exam.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {exam.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3.5 h-3.5" />
              {exam.question_count} questions
            </span>
            <span>Pass: {exam.pass_mark}%</span>
          </div>

          {status !== 'completed' && hasStarted && endsIn > 0 && endsIn < 3600_000 && (
            <div className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 font-medium">
              ⚠️ Closes in {formatDuration(endsIn)}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 self-center">
          {status === 'pending' && hasEnded ? (
            <button
              disabled
              className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-400 font-semibold cursor-not-allowed"
            >
              Closed
            </button>
          ) : status === 'pending' && !hasStarted ? (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Opens
              </p>
              <p className="text-xs font-mono text-slate-600">
                {new Date(exam.start_at).toLocaleString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ) : status === 'pending' ? (
            <Link to={`/exam/${exam.id}`} className="btn-primary py-2.5 px-4 text-sm">
              <PlayCircleIcon className="w-4 h-4" />
              Start
            </Link>
          ) : status === 'in_progress' ? (
            <Link to={`/exam/${exam.id}`} className="btn-primary py-2.5 px-4 text-sm">
              <BoltIcon className="w-4 h-4" />
              Resume
            </Link>
          ) : (
            <Link to="/student/results" className="btn-secondary py-2.5 px-4 text-sm">
              <EyeIcon className="w-4 h-4" />
              Details
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
          stroke="#e2e8f0"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-slate-900 text-xs">
          {score}%
        </span>
      </div>
    </div>
  );
}

function UpcomingCard({ upcoming, now }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <CalendarDaysIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">
            Upcoming
          </h3>
          <p className="text-[11px] text-slate-500">
            {upcoming.length} scheduled
          </p>
        </div>
      </div>

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
                style={{
                  backgroundColor: e.subjects?.color ?? '#6366f1',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {e.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {new Date(e.start_at).toLocaleString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-[11px] text-brand-600 font-semibold mt-0.5">
                  In {formatDuration(startsIn)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RecentActivityCard({ recent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ChartBarIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">
            Recent activity
          </h3>
          <p className="text-[11px] text-slate-500">Your latest submissions</p>
        </div>
      </div>

      <div className="space-y-3">
        {recent.map((r) => {
          const subject = r.exams?.subjects;
          return (
            <div key={r.id} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  r.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {r.passed ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-bold">F</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {r.exams?.title ?? 'Untitled exam'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {subject?.name} ·{' '}
                  {r.submitted_at
                    ? timeAgo(new Date(r.submitted_at))
                    : 'recently'}
                </p>
              </div>
              <span
                className={`font-display font-bold text-sm ${
                  r.passed ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {r.score ?? 0}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SubjectPerformanceCard({ subjects }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <BookOpenIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">
            By subject
          </h3>
          <p className="text-[11px] text-slate-500">Your strongest areas</p>
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 truncate">
                {s.name}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {s.avg}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.avg}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickLinksCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
          <StarIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">
            Quick links
          </h3>
          <p className="text-[11px] text-slate-500">Jump right in</p>
        </div>
      </div>

      <div className="space-y-2">
        <QuickLink to="/student/notes" icon={BookOpenIcon} label="Notes & assignments" />
        <QuickLink to="/student/reports" icon={ClipboardDocumentCheckIcon} label="Report cards" />
        <QuickLink to="/student/results" icon={TrophyIcon} label="My results" />
        <QuickLink to="/student" icon={AcademicCapIcon} label="My dashboard" />
      </div>
    </motion.div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition">
        <Icon className="w-4 h-4" />
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
  if (pendingCount === 0) return "You're all caught up! 🎉";
  if (pendingCount === 1) return 'One exam awaits you';
  return `${pendingCount} exams awaiting you`;
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