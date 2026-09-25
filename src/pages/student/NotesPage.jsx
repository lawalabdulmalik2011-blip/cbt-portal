import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { listNotes, getMySubmission } from '../../lib/notes';
import { useAuth } from '../../context/AuthContext.jsx';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import NotesCard from '../../components/notes/NotesCard.jsx';
import NotesViewerModal from '../../components/notes/NotesViewerModal.jsx';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'note', label: 'Notes' },
  { key: 'assignment', label: 'Assignments' },
];

export default function StudentNotesPage() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listNotes({
        type: typeFilter,
        classLevel: profile?.class_level,
      });
      setNotes(data);

      // Fetch submissions
      const subs = await Promise.all(
        data.map((n) =>
          n.type === 'assignment' ? getMySubmission(n.id) : Promise.resolve(null)
        )
      );
      const ids = new Set();
      subs.forEach((s, i) => {
        if (s) ids.add(data[i].id);
      });
      setSubmittedIds(ids);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [typeFilter, profile]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  const pendingAssignments = notes.filter(
    (n) => n.type === 'assignment' && !submittedIds.has(n.id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="student" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl p-8 mb-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpenIcon className="w-5 h-5" />
                  <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                    Study material
                  </p>
                </div>
                <h1 className="font-display text-4xl font-extrabold">
                  Notes & Assignments
                </h1>
                <p className="text-white/80 mt-2 max-w-xl">
                  {pendingAssignments > 0
                    ? `You have ${pendingAssignments} pending assignment${pendingAssignments === 1 ? '' : 's'}. Tap any card to view and answer.`
                    : 'All caught up! Open any note to read and copy.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-white">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">
                    Pending
                  </p>
                  <p className="font-display text-2xl font-extrabold leading-tight">
                    {pendingAssignments}
                  </p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-white">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">
                    Total
                  </p>
                  <p className="font-display text-2xl font-extrabold leading-tight">
                    {notes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes & assignments…"
                className="input pl-12"
              />
            </div>
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    typeFilter === f.key
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4">
                <BookOpenIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                Nothing here yet
              </h3>
              <p className="text-slate-500 mt-1">
                Your teacher hasn't shared any notes or assignments yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((n, i) => (
                <NotesCard
                  key={n.id}
                  note={n}
                  onClick={() => setSelected(n)}
                  submitted={submittedIds.has(n.id)}
                  delay={i * 0.04}
                  now={now}
                />
              ))}
            </div>
          )}
        </main>
      </PageTransition>

      <NotesViewerModal
        open={!!selected}
        onClose={() => setSelected(null)}
        note={selected}
        onSubmitted={load}
      />
    </div>
  );
}