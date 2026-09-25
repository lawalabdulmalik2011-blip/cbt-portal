import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  EyeIcon,
  TrophyIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyReportCards, computeReportStats } from '../../lib/reportCards';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import ReportCardViewer from '../../components/report/ReportCardViewer.jsx';

export default function StudentReportCardsPage() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyReportCards(user.id);
        setReports(data);
      } catch (err) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="student" />
      <PageTransition>
        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl p-8 mb-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="w-5 h-5 text-white" />
                <p className="text-white/80 text-xs uppercase tracking-widest font-semibold">
                  Academic Records
                </p>
              </div>
              <h1 className="font-display text-4xl font-extrabold text-white">
                My Report Cards
              </h1>
              <p className="text-white/80 mt-2 max-w-lg">
                {reports.length > 0
                  ? `You have ${reports.length} published report card${reports.length === 1 ? '' : 's'}. Tap any to view and print.`
                  : 'Your report cards will appear here once your teacher publishes them.'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                No report cards yet
              </h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                When your teacher publishes a report card, it'll appear here.
                You'll be able to view, print, or save it as PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((r, i) => {
                const stats = computeReportStats(r.scores ?? []);
                return (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelected(r)}
                    className="w-full glass rounded-2xl p-6 text-left group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />

                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition">
                        <DocumentTextIcon className="w-7 h-7 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge bg-brand-100 text-brand-700">
                            {r.session}
                          </span>
                          <span className="badge bg-slate-100 text-slate-700">
                            {r.term} Term
                          </span>
                          <span className="badge bg-emerald-100 text-emerald-700">
                            Published
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-slate-900 text-lg">
                          {r.class_level} Report Card
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {stats.subjects} subjects ·{' '}
                          <strong className="text-slate-700">
                            {stats.average}% average
                          </strong>{' '}
                          · {stats.passed} passed, {stats.failed} failed
                        </p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <ChartBarIcon className="w-4 h-4" />
                          <span className="font-display text-2xl font-extrabold">
                            {stats.average}%
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
                          <EyeIcon className="w-3 h-3" />
                          Tap to view
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </main>
      </PageTransition>

      <ReportCardViewer
        open={!!selected}
        onClose={() => setSelected(null)}
        report={selected ? { ...selected, student: profile } : null}
      />
    </div>
  );
}