import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getExam } from '../../lib/exams';
import { listExamAttempts } from '../../lib/attempts';
import { downloadCSV } from '../../lib/csv';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function ResultsPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [e, atts] = await Promise.all([
          getExam(examId),
          listExamAttempts(examId),
        ]);
        setExam(e);
        setAttempts(atts);
      } catch (err) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  function exportCSV() {
    const rows = attempts.map((a) => ({
      name: a.profiles?.full_name ?? '',
      exam_number: a.profiles?.exam_number ?? '',
      class_level: a.profiles?.class_level ?? '',
      score: a.score ?? 0,
      passed: a.passed ? 'Yes' : 'No',
      submitted_at: a.submitted_at ?? '',
    }));
    downloadCSV(rows, `${exam?.title ?? 'results'}-results.csv`);
  }

  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length)
    : 0;
  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : 0;

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Results
              </h1>
              <p className="text-slate-500 mt-2">{exam?.title}</p>
            </div>
            <button onClick={exportCSV} className="btn-secondary">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <Stat label="Total attempts" value={attempts.length} />
            <Stat label="Average score" value={`${avg}%`} />
            <Stat label="Pass rate" value={`${passRate}%`} />
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50/70">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Exam No.</th>
                  <th className="px-6 py-4 font-semibold">Class</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Result</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {a.profiles?.full_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">
                      {a.profiles?.exam_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {a.profiles?.class_level ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-display font-bold ${a.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {a.score ?? '—'}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.status === 'in_progress' ? (
                        <span className="badge bg-amber-100 text-amber-700">In progress</span>
                      ) : a.passed ? (
                        <span className="badge bg-emerald-100 text-emerald-700">Passed</span>
                      ) : (
                        <span className="badge bg-rose-100 text-rose-700">Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleString()
                        : '—'}
                    </td>
                  </motion.tr>
                ))}
                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No attempts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="font-display text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}