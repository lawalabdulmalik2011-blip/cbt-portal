import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon,
  PencilSquareIcon,
  TrashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  listExams,
  getExam,
  deleteExam,
  publishExam,
  closeExam,
} from '../../lib/exams';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import ExamForm from '../../components/exams/ExamForm.jsx';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'published', label: 'Published' },
  { key: 'closed', label: 'Closed' },
];

const STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-rose-100 text-rose-700',
};

export default function ExamsListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editExam, setEditExam] = useState(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listExams({ status: statusFilter });
      setExams(data);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  async function handleEdit(exam) {
    try {
      const full = await getExam(exam.id);
      setEditExam(full);
      setFormOpen(true);
    } catch (err) {
      toast.error('Failed to load exam');
    }
  }

  async function handlePublish(exam) {
    if (!confirm(`Publish "${exam.title}"? Students will be able to take it.`)) return;
    try {
      await publishExam(exam.id);
      toast.success('Exam published');
      fetchExams();
    } catch (err) {
      toast.error('Failed to publish');
    }
  }

  async function handleClose(exam) {
    if (!confirm(`Close "${exam.title}"? No new attempts will be allowed.`)) return;
    try {
      await closeExam(exam.id);
      toast.success('Exam closed');
      fetchExams();
    } catch (err) {
      toast.error('Failed to close');
    }
  }

  async function handleDelete(exam) {
    if (!confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    try {
      await deleteExam(exam.id);
      toast.success('Exam deleted');
      fetchExams();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Exams
              </h1>
              <p className="text-slate-500 mt-2">
                Create, publish, and monitor your exams
              </p>
            </div>
            <button
              onClick={() => {
                setEditExam(null);
                setFormOpen(true);
              }}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              Create exam
            </button>
          </div>

          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  statusFilter === f.key
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-28" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">
                No exams yet. Click <strong>Create exam</strong> to begin.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-2xl p-6 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`badge ${STATUS_STYLE[e.status]}`}>
                          {e.status}
                        </span>
                        {e.subjects && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${e.subjects.color}20`,
                              color: e.subjects.color,
                            }}
                          >
                            {e.subjects.name}
                          </span>
                        )}
                        {e.target_classes?.length > 0 && (
                          <span className="badge bg-slate-100 text-slate-600">
                            {e.target_classes.join(', ')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-lg">
                        {e.title}
                      </h3>
                      {e.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {e.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {e.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          {e.question_count} questions
                        </span>
                        <span>Pass: {e.pass_mark}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-2 rounded-lg text-brand-600 hover:bg-brand-50"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      {e.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(e)}
                          className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <PlayIcon className="w-3.5 h-3.5" /> Publish
                        </button>
                      )}
                      {e.status === 'published' && (
                        <button
                          onClick={() => handleClose(e)}
                          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <LockClosedIcon className="w-3.5 h-3.5" /> Close
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>

      <ExamForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditExam(null);
        }}
        exam={editExam}
        onSaved={fetchExams}
      />
    </div>
  );
}