import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  getOrCreateSession,
  listRecords,
  saveRecord,
  bulkMarkPresent,
} from '../../lib/attendance';
import { listClasses, listStudentsInClass } from '../../lib/classes';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const STATUS_OPTIONS = [
  { key: 'present', label: 'Present', icon: CheckCircleIcon, color: 'emerald' },
  { key: 'late', label: 'Late', icon: ClockIcon, color: 'amber' },
  { key: 'absent', label: 'Absent', icon: XCircleIcon, color: 'rose' },
  { key: 'excused', label: 'Excused', icon: ShieldCheckIcon, color: 'brand' },
];

const COLOR_CLASSES = {
  emerald: 'bg-emerald-500 border-emerald-500 text-white',
  amber: 'bg-amber-500 border-amber-500 text-white',
  rose: 'bg-rose-500 border-rose-500 text-white',
  brand: 'bg-brand-500 border-brand-500 text-white',
};

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(0);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cls = await listClasses();
        setClasses(cls);
        if (cls.length) setSelectedClass(cls[0]);
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    loadRoster();
  }, [selectedClass, date, period]);

  async function loadRoster() {
    try {
      const [studs, sess] = await Promise.all([
        listStudentsInClass(selectedClass.name),
        getOrCreateSession({
          classId: selectedClass.id,
          date,
          period,
        }),
      ]);
      setStudents(studs);
      setSession(sess);

      const recs = await listRecords(sess.id);
      const map = {};
      recs.forEach((r) => {
        map[r.student_id] = r.status;
      });
      setRecords(map);
    } catch (err) {
      toast.error('Failed to load roster');
    }
  }

  async function handleMark(studentId, status) {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
    if (!session) return;
    try {
      await saveRecord({
        sessionId: session.id,
        studentId,
        status,
      });
    } catch (err) {
      toast.error('Failed to save');
    }
  }

  async function handleMarkAllPresent() {
    setSaving(true);
    try {
      const map = {};
      students.forEach((s) => (map[s.id] = 'present'));
      setRecords(map);
      await bulkMarkPresent({
        sessionId: session.id,
        studentIds: students.map((s) => s.id),
      });
      toast.success('All marked present');
    } catch (err) {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(records).filter((s) => s === 'present').length;
  const absentCount = Object.values(records).filter((s) => s === 'absent').length;

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              Attendance
            </h1>
            <p className="text-slate-500 mt-2">Mark daily attendance</p>
          </div>

          <div className="glass rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Class
                </label>
                <select
                  value={selectedClass?.id ?? ''}
                  onChange={(e) =>
                    setSelectedClass(classes.find((c) => c.id === e.target.value))
                  }
                  className="input"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
                  className="input"
                >
                  <option value={0}>Whole day</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Total" value={students.length} color="brand" icon={UserGroupIcon} />
            <StatCard label="Present" value={presentCount} color="emerald" icon={CheckCircleIcon} />
            <StatCard label="Absent" value={absentCount} color="rose" icon={XCircleIcon} />
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleMarkAllPresent}
              disabled={saving || !students.length}
              className="btn-primary text-sm"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark all present
            </button>
          </div>

          {students.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No students in this class</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass rounded-xl p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap"
                >
                  {s.photo_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {s.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {s.full_name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {s.exam_number}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = records[s.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleMark(s.id, opt.key)}
                          className={`px-2.5 py-1.5 rounded-lg border-2 text-xs font-semibold transition flex items-center gap-1 ${
                            isActive
                              ? COLOR_CLASSES[opt.color]
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  const map = {
    brand: 'from-brand-500 to-brand-600',
    emerald: 'from-emerald-500 to-teal-600',
    rose: 'from-rose-500 to-red-600',
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${map[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="font-display text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
        {value}
      </p>
    </div>
  );
}