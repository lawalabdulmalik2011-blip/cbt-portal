import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  getClassStats,
  createClass,
  deleteClass,
  listStudentsInClass,
  bulkPromote,
} from '../../lib/classes';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailClass, setDetailClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getClassStats();
      setClasses(data);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openDetail(c) {
    setDetailClass(c);
    setLoadingStudents(true);
    try {
      const data = await listStudentsInClass(c.name);
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete class "${c.name}"? Students will keep their class_level but the class row is removed.`)) return;
    try {
      await deleteClass(c.id);
      toast.success('Class deleted');
      load();
    } catch (err) {
      toast.error('Failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Classes
              </h1>
              <p className="text-slate-500 mt-2">
                Manage classes and promote students
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPromoteOpen(true)} className="btn-secondary">
                <ArrowUpIcon className="w-5 h-5" />
                Promote class
              </button>
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                <PlusIcon className="w-5 h-5" />
                New class
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <UserGroupIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No classes yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -4 }}
                  onClick={() => openDetail(c)}
                  className="glass rounded-2xl p-5 text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg">
                      <AcademicCapIcon className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900 mt-4">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                    {c.level}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="flex items-center gap-1 text-slate-600">
                      <UserGroupIcon className="w-4 h-4" />
                      <strong className="text-slate-900">{c.student_count}</strong> students
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </main>
      </PageTransition>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailClass && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailClass(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    {detailClass.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {students.length} students
                  </p>
                </div>
                <button
                  onClick={() => setDetailClass(null)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingStudents ? (
                  <Spinner className="py-12" />
                ) : students.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">
                    No students in this class
                  </p>
                ) : (
                  <div className="space-y-2">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50"
                      >
                        {s.photo_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                            <img
                              src={s.photo_url}
                              alt={s.full_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateClassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />
      <PromoteModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        classes={classes.map((c) => c.name)}
        onPromoted={load}
      />
    </div>
  );
}

// ============================================
// MODALS
// ============================================
function CreateClassModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [section, setSection] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return toast.error('Name required');
    setBusy(true);
    try {
      await createClass({
        name: name.trim().toUpperCase(),
        level: level.trim().toUpperCase(),
        section: section.trim().toUpperCase(),
        capacity,
      });
      toast.success('Class created');
      onCreated?.();
      onClose();
      setName('');
      setLevel('');
      setSection('');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 pointer-events-auto">
              <h2 className="font-display text-2xl font-extrabold mb-6">
                New class
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SS2C"
                    className="input"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Level</label>
                    <input
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      placeholder="SS2"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Section</label>
                    <input
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="C"
                      maxLength={2}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 50)}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={busy} className="btn-primary flex-1">
                  {busy ? <><Spinner size={16} /> Creating…</> : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PromoteModal({ open, onClose, classes, onPromoted }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handlePromote() {
    if (!from || !to) return toast.error('Pick both classes');
    if (from === to) return toast.error('From and To cannot be same');

    if (!confirm(`Promote ALL students in ${from} to ${to}?\n\nThis cannot be undone easily.`))
      return;

    setBusy(true);
    try {
      const count = await bulkPromote({ from, to });
      toast.success(`Promoted ${count} student(s)`);
      onPromoted?.();
      onClose();
      setFrom('');
      setTo('');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 pointer-events-auto">
              <h2 className="font-display text-2xl font-extrabold mb-2">
                Promote class
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Move all students from one class to the next.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">From</label>
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="input"
                  >
                    <option value="">— Select class —</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">To</label>
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="input"
                  >
                    <option value="">— Select class —</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handlePromote} disabled={busy} className="btn-primary flex-1">
                  {busy ? <><Spinner size={16} /> Promoting…</> : 'Promote'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}