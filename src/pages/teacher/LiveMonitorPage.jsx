import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { listExamAttempts } from '../../lib/attempts';
import { getExam } from '../../lib/exams';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function LiveMonitorPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [e, atts] = await Promise.all([
        getExam(examId),
        listExamAttempts(examId),
      ]);
      setExam(e);
      setAttempts(atts);

      // Fetch recent proctor logs for each attempt
      const attemptIds = atts.map((a) => a.id);
      if (attemptIds.length) {
        const { data: logs } = await supabase
          .from('proctor_logs')
          .select('*')
          .in('attempt_id', attemptIds)
          .order('created_at', { ascending: false })
          .limit(200);

        const grouped = {};
        (logs ?? []).forEach((l) => {
          grouped[l.attempt_id] = grouped[l.attempt_id] ?? [];
          grouped[l.attempt_id].push(l);
        });
        setLogs(grouped);
      }
    } catch (err) {
      toast.error('Failed to load monitor data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, [examId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  const active = attempts.filter((a) => a.status === 'in_progress');
  const submitted = attempts.filter((a) => a.status === 'submitted');

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
                Live
              </span>
            </div>
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              {exam?.title}
            </h1>
            <p className="text-slate-500 mt-2">
              Watching {active.length} active · {submitted.length} submitted
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard label="Active" value={active.length} color="emerald" />
            <StatCard label="Submitted" value={submitted.length} color="brand" />
            <StatCard
              label="Flagged"
              value={attempts.filter((a) => (logs[a.id]?.length ?? 0) > 3).length}
              color="rose"
            />
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-display text-lg font-bold text-slate-800">
                Students
              </h2>
            </div>

            {attempts.length === 0 ? (
              <div className="p-12 text-center">
                <UsersIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No students have started yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attempts.map((a) => {
                  const student = a.profiles;
                  const studentLogs = logs[a.id] ?? [];
                  const flagged = studentLogs.length > 3;

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 flex items-center justify-between hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold">
                          {student?.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student?.full_name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {student?.exam_number}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {studentLogs.length > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <ExclamationTriangleIcon
                              className={`w-4 h-4 ${
                                flagged ? 'text-rose-500' : 'text-amber-500'
                              }`}
                            />
                            <span className={flagged ? 'text-rose-600 font-semibold' : 'text-amber-600'}>
                              {studentLogs.length} event{studentLogs.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        )}

                        {a.status === 'in_progress' ? (
                          <span className="badge bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                            In progress
                          </span>
                        ) : (
                          <span className="badge bg-brand-100 text-brand-700">
                            Score: {a.score ?? 0}%
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    emerald: 'from-emerald-500 to-teal-600',
    brand: 'from-brand-500 to-brand-600',
    rose: 'from-rose-500 to-red-600',
  };
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className="font-display text-3xl font-extrabold text-slate-900">{value}</p>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <EyeIcon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}