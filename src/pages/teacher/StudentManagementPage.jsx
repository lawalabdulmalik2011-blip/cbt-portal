import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { searchStudents } from '../../lib/studentAdmin.js';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import StudentSearchBar from '../../components/teacher/StudentSearchBar.jsx';
import StudentDetailPanel from '../../components/teacher/StudentDetailPanel.jsx';

export default function StudentManagementPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // Initial load
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const data = await searchStudents({});
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setLoading(true);
    try {
      const data = await searchStudents({ query });
      setResults(data);
      if (data.length === 1) setSelected(data[0].id);
    } catch (err) {
      toast.error(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-extrabold text-slate-900">
              Student Management
            </h1>
            <p className="text-slate-500 mt-2">
              Search for a student to reopen exams, view scores, or review violations
            </p>
          </div>

          <StudentSearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            loading={loading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            {/* Results list */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
                  {loading
                    ? 'Loading…'
                    : `${results.length} student${results.length === 1 ? '' : 's'}`}
                </p>

                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton h-16" />
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-10">
                    <UsersIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">
                      {query ? 'No students found' : 'No students yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {results.map((s) => (
                      <motion.button
                        key={s.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelected(s.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition flex items-center gap-3 ${
                          selected === s.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-transparent hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {s.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-sm">
                            {s.full_name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono truncate">
                            {s.exam_number}
                          </p>
                        </div>
                        {s.class_level && (
                          <span className="badge bg-slate-100 text-slate-600 text-[10px]">
                            {s.class_level}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <StudentDetailPanel
                      studentId={selected}
                      onClose={() => setSelected(null)}
                      onChanged={loadAll}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]"
                  >
                    <UsersIcon className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-500">
                      Click a student to view details
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}