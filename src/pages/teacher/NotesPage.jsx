import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  BookOpenIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { listNotes, deleteNote } from '../../lib/notes';
import { listSubjects } from '../../lib/questions';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import NotesCard from '../../components/notes/NotesCard.jsx';
import NoteEditorModal from '../../components/notes/NoteEditorModal.jsx';
import NoteSubmissionsModal from '../../components/notes/NoteSubmissionsModal.jsx';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'note', label: 'Notes' },
  { key: 'assignment', label: 'Assignments' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [submissionsNote, setSubmissionsNote] = useState(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotes({
        type: typeFilter,
        subjectId: subjectFilter || undefined,
      });
      const filtered = search.trim()
        ? data.filter(
            (n) =>
              n.title.toLowerCase().includes(search.toLowerCase()) ||
              n.content.toLowerCase().includes(search.toLowerCase())
          )
        : data;
      setNotes(filtered);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, subjectFilter, search]);

  useEffect(() => {
    listSubjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchNotes, 250);
    return () => clearTimeout(t);
  }, [fetchNotes]);

  async function handleDelete(note) {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    try {
      await deleteNote(note.id);
      toast.success('Deleted');
      fetchNotes();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  function handleEdit(note) {
    setEditNote(note);
    setEditorOpen(true);
  }

  function handleViewSubmissions(note) {
    setSubmissionsNote(note);
    setSubmissionsOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Notes & Assignments
              </h1>
              <p className="text-slate-500 mt-2">
                Share study material and assignments with your students
              </p>
            </div>
            <button
              onClick={() => {
                setEditNote(null);
                setEditorOpen(true);
              }}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              New
            </button>
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
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input w-auto min-w-[180px]"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
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
          ) : notes.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4">
                <BookOpenIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                No notes yet
              </h3>
              <p className="text-slate-500 mt-1">
                Create your first note or assignment to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((n, i) => (
                <div key={n.id} className="relative">
                  <NotesCard
                    note={n}
                    onClick={() => handleViewSubmissions(n)}
                    editable
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    delay={i * 0.04}
                    now={now}
                  />
                  {/* Small submissions badge overlay for assignments */}
                  {n.type === 'assignment' && (
                    <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-wide text-amber-600 font-bold flex items-center gap-1 opacity-60">
                      <EyeIcon className="w-3 h-3" />
                      View submissions
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>

      <NoteEditorModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditNote(null);
        }}
        note={editNote}
        onSaved={fetchNotes}
      />

      <NoteSubmissionsModal
        open={submissionsOpen}
        onClose={() => {
          setSubmissionsOpen(false);
          setSubmissionsNote(null);
        }}
        note={submissionsNote}
      />
    </div>
  );
}