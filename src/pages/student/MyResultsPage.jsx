import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { listMyResults } from '../../lib/attempts';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function MyResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listMyResults(user.id);
        setResults(data);
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / results.length)
    : 0;
  const passed = results.filter((r) => r.passed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="student" />
      <PageTransition>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              My Results
            </h1>
            <p className="text-slate-500 mt-2">
              Your exam history and performance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <StatCard icon={TrophyIcon} label="Exams taken" value={results.length} color="brand" />
            <StatCard icon={ChartBarIcon} label="Average score" value={`${avg}%`} color="emerald" />
            <StatCard icon={TrophyIcon} label="Passed" value={`${passed} / ${results.length}`} color="amber" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-slate-500">You haven't taken any exams yet.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4 font-semibold">Exam</th>
                    <th className="px-6 py-4 font-semibold">Subject</th>
                    <th className="px-6 py-4 font-semibold">Score</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {r.exams?.title ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.exams?.subjects?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-display font-bold ${
                            r.passed ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {r.score ?? 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.passed ? (
                          <span className="badge bg-emerald-100 text-emerald-700">Passed</span>
                        ) : (
                          <span className="badge bg-rose-100 text-rose-700">Failed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {r.submitted_at
                          ? new Date(r.submitted_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
  };
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="font-display text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}