import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  FolderPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  listSubjects,
  createSubject,
  deleteSubject,
  listQuestions,
  deleteQuestion,
} from '../../lib/questions.js';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import QuestionList from '../../components/questions/QuestionList.jsx';
import QuestionEditor from '../../components/questions/QuestionEditor.jsx';
import BulkQuestionImport from '../../components/questions/BulkQuestionImport.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'mcq', label: 'MCQ' },
  { key: 'true_false', label: 'True/False' },
  { key: 'short_answer', label: 'Short' },
  { key: 'essay', label: 'Essay' },
];

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Load subjects on mount
  useEffect(() => {
    (async () => {
      setLoadingSubjects(true);
      try {
        const data = await listSubjects();
        setSubjects(data);
        if (data.length && !selectedSubjectId) {
          setSelectedSubjectId(data[0].id);
        }
      } catch (err) {
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, []);

  // Load questions when subject/filter/search changes
  const fetchQuestions = useCallback(async () => {
    if (!selectedSubjectId) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      const data = await listQuestions({
        subjectId: selectedSubjectId,
        type: typeFilter,
        search: search.trim() || undefined,
      });
      setQuestions(data);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedSubjectId, typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchQuestions, 250);
    return () => clearTimeout(t);
  }, [fetchQuestions]);

  async function refreshSubjects() {
    const data = await listSubjects();
    setSubjects(data);
  }

  async function handleCreateSubject() {
    if (!newSubjectName.trim()) {
      toast.error('Subject name required');
      return;
    }
    try {
      const s = await createSubject({
        name: newSubjectName,
        code: newSubjectCode,
      });
      toast.success('Subject created');
      await refreshSubjects();
      setSelectedSubjectId(s.id);
      setNewSubjectOpen(false);
      setNewSubjectName('');
      setNewSubjectCode('');
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    }
  }

  async function handleDeleteSubject(subject) {
    if (subject.question_count > 0) {
      if (!confirm(`Delete "${subject.name}" and all ${subject.question_count} questions?`)) return;
    } else {
      if (!confirm(`Delete "${subject.name}"?`)) return;
    }
    try {
      await deleteSubject(subject.id);
      toast.success('Subject deleted');
      await refreshSubjects();
      if (selectedSubjectId === subject.id) {
        setSelectedSubjectId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }

  async function handleDeleteQuestion(q) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(q.id);
      toast.success('Question deleted');
      fetchQuestions();
      refreshSubjects();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  function handleEditQuestion(q) {
    setEditQuestion(q);
    setEditorOpen(true);
  }

  function handleNewQuestion() {
    setEditQuestion(null);
    setEditorOpen(true);
  }

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Question Bank
              </h1>
              <p className="text-slate-500 mt-2">
                Build your question repository by subject
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNewSubjectOpen(true)}
                className="btn-secondary"
              >
                <FolderPlusIcon className="w-5 h-5" />
                New subject
              </button>
              {selectedSubjectId && (
                <>
                  <button
                    onClick={() => setImportOpen(true)}
                    className="btn-secondary"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Import CSV
                  </button>
                  <button onClick={handleNewQuestion} className="btn-primary">
                    <PlusIcon className="w-5 h-5" />
                    New question
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar — subjects */}
            <aside className="lg:col-span-1">
              <div className="glass rounded-2xl p-4 sticky top-24">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3 px-2">
                  Subjects
                </p>
                {loadingSubjects ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton h-10" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {subjects.map((s) => (
                      <div
                        key={s.id}
                        className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition ${
                          selectedSubjectId === s.id
                            ? 'bg-brand-500 text-white'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                        onClick={() => setSelectedSubjectId(s.id)}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="flex-1 text-sm font-semibold truncate">
                          {s.name}
                        </span>
                        <span
                          className={`text-xs ${
                            selectedSubjectId === s.id
                              ? 'text-white/70'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.question_count}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(s);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition ${
                            selectedSubjectId === s.id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-rose-50 text-rose-500'
                          }`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {!subjects.length && (
                      <p className="text-sm text-slate-400 px-2 py-4 text-center">
                        No subjects. Create one to start.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-3">
              {!selectedSubjectId ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    Select a subject from the sidebar to start adding questions.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-slate-900">
                        {selectedSubject?.name}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {questions.length} question{questions.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search questions…"
                        className="input pl-10 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit overflow-x-auto">
                    {TYPE_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setTypeFilter(f.key)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                          typeFilter === f.key
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <QuestionList
                    questions={questions}
                    loading={loadingQuestions}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </PageTransition>

      {/* Modals */}
      <QuestionEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditQuestion(null); }}
        subjectId={selectedSubjectId}
        question={editQuestion}
        onSaved={() => { fetchQuestions(); refreshSubjects(); }}
      />
      <BulkQuestionImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        subjectId={selectedSubjectId}
        onImported={() => { fetchQuestions(); refreshSubjects(); }}
      />

      {/* New subject modal */}
      {newSubjectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setNewSubjectOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-6">
              New subject
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject name
                </label>
                <input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Further Mathematics"
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Short code (optional)
                </label>
                <input
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FMT"
                  maxLength={4}
                  className="input font-mono uppercase"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setNewSubjectOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleCreateSubject} className="btn-primary flex-1">
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}