import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { searchStudents } from '../../lib/studentAdmin';
import {
  listReportCards,
  deleteReportCard,
  publishReportCard,
  unpublishReportCard,
  computeReportStats,
} from '../../lib/reportCards';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import ReportCardEditor from '../../components/report/ReportCardEditor.jsx';
import ReportCardViewer from '../../components/report/ReportCardViewer.jsx';

export default function ReportCardsPage() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  // Initial students
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await searchStudents({});
        setStudents(data);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const loadReports = useCallback(async () => {
    if (!selectedStudent) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    try {
      const data = await listReportCards({ studentId: selectedStudent.id });
      setReports(data);
    } catch (err) {
      toast.error('Failed to load reports');
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleSearch() {
    setLoading(true);
    try {
      const data = await searchStudents({ query });
      setStudents(data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    if (!selectedStudent) {
      toast.error('Select a student first');
      return;
    }
    setEditReport(null);
    setEditorOpen(true);
  }

  function handleEdit(report) {
    setEditReport(report);
    setEditorOpen(true);
  }

  async function handleDelete(report) {
    if (!confirm(`Delete this ${report.session} ${report.term} report card?`)) return;
    try {
      await deleteReportCard(report.id);
      toast.success('Deleted');
      loadReports();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  async function handleTogglePublish(report) {
    try {
      if (report.status === 'published') {
        await unpublishReportCard(report.id);
        toast.success('Unpublished');
      } else {
        await publishReportCard(report.id);
        toast.success('Published — student can now view it');
      }
      loadReports();
    } catch (err) {
      toast.error('Failed to update');
    }
  }

  function handleView(report) {
    setViewReport(report);
    setViewerOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Report Cards
              </h1>
              <p className="text-slate-500 mt-2">
                Create, edit, and publish student report cards
              </p>
            </div>
            {selectedStudent && (
              <button onClick={handleNew} className="btn-primary">
                <PlusIcon className="w-5 h-5" />
                New report card
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Students list */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  className="mb-4"
                >
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search students…"
                      className="input pl-10 pr-24"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 btn-primary py-2 px-3 text-xs"
                    >
                      Search
                    </button>
                  </div>
                </form>

                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                  {loading ? 'Loading…' : `${students.length} students`}
                </p>

                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton h-14" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition flex items-center gap-3 ${
                          selectedStudent?.id === s.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-transparent hover:border-slate-200 bg-white'
                        }`}
                      >
                        {s.photo_url ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                            <img
                              src={s.photo_url}
                              alt={s.full_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {s.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {s.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            {s.exam_number}
                          </p>
                        </div>
                        {s.class_level && (
                          <span className="badge bg-slate-100 text-slate-600 text-[10px]">
                            {s.class_level}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reports */}
            <div className="lg:col-span-3">
              {!selectedStudent ? (
                <div className="glass rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                  <DocumentTextIcon className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    Select a student to view their report cards
                  </p>
                </div>
              ) : (
                <>
                  {/* Student header */}
                  <div className="glass rounded-2xl p-5 mb-4 flex items-center gap-4">
                    {selectedStudent.photo_url ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100">
                        <img
                          src={selectedStudent.photo_url}
                          alt={selectedStudent.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
                        {selectedStudent.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-xl font-extrabold text-slate-900">
                        {selectedStudent.full_name}
                      </h2>
                      <p className="text-sm text-slate-500 font-mono">
                        {selectedStudent.exam_number} · {selectedStudent.class_level}
                      </p>
                    </div>
                  </div>

                  {loadingReports ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                      ))}
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 mb-4">
                        No report cards yet for this student
                      </p>
                      <button onClick={handleNew} className="btn-primary">
                        <PlusIcon className="w-4 h-4" />
                        Create first report card
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((r) => {
                        const stats = computeReportStats(r.scores ?? []);
                        return (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass rounded-2xl p-5 relative overflow-hidden ${
                              r.status === 'published'
                                ? 'border-l-4 border-emerald-500'
                                : 'border-l-4 border-amber-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="badge bg-brand-100 text-brand-700">
                                    {r.session}
                                  </span>
                                  <span className="badge bg-slate-100 text-slate-700">
                                    {r.term} Term
                                  </span>
                                  {r.status === 'published' ? (
                                    <span className="badge bg-emerald-100 text-emerald-700">
                                      Published
                                    </span>
                                  ) : (
                                    <span className="badge bg-amber-100 text-amber-700">
                                      Draft
                                    </span>
                                  )}
                                </div>
                                <p className="font-display font-bold text-slate-900">
                                  {r.class_level} · {stats.subjects} subjects
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Average: <strong>{stats.average}%</strong> · Total:{' '}
                                  {stats.total} · Passed: {stats.passed}/
                                  {stats.subjects}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleView(r)}
                                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                                  title="View"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(r)}
                                  className="p-2 rounded-lg text-brand-600 hover:bg-brand-50"
                                  title="Edit"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTogglePublish(r)}
                                  className={`p-2 rounded-lg ${
                                    r.status === 'published'
                                      ? 'text-amber-600 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={
                                    r.status === 'published' ? 'Unpublish' : 'Publish'
                                  }
                                >
                                  {r.status === 'published' ? (
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpTrayIcon className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(r)}
                                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </PageTransition>

      <ReportCardEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditReport(null);
        }}
        student={selectedStudent}
        report={editReport}
        onSaved={loadReports}
      />

      <ReportCardViewer
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewReport(null);
        }}
        report={
          viewReport
            ? { ...viewReport, student: selectedStudent }
            : null
        }
      />
    </div>
  );
}