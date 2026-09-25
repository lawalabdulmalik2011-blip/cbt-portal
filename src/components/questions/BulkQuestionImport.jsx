import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { parseCSV, downloadCSV } from '../../lib/csv';
import { bulkImportQuestions, QUESTION_CSV_TEMPLATE } from '../../lib/questions';
import Spinner from '../ui/Spinner.jsx';

export default function BulkQuestionImport({ open, onClose, subjectId, onImported }) {
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  function reset() {
    setStep('upload');
    setRows([]);
    setImporting(false);
    setImportedCount(0);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file) {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (!parsed.length) throw new Error('CSV is empty');
      if (!parsed[0].question_text) {
        throw new Error('CSV must have a "question_text" column');
      }
      setRows(parsed);
      setStep('preview');
    } catch (err) {
      toast.error(err.message || 'Parse failed');
    }
  }

  function downloadTemplate() {
    const blob = new Blob([QUESTION_CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport() {
    setImporting(true);
    try {
      const result = await bulkImportQuestions(subjectId, rows);
      setImportedCount(result.length);
      setStep('done');
      onImported?.();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
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
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Bulk import questions
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {step === 'upload' && (
                  <>
                    <div
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFile(e.dataTransfer.files?.[0]);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                        dragOver
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                      <p className="font-semibold text-slate-700">
                        Drop your CSV here, or click to browse
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Columns: type, question_text, option_a-d, correct_answer, topic, difficulty, explanation
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="btn-secondary w-full mt-4"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Download template
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      className="hidden"
                    />
                  </>
                )}

                {step === 'preview' && (
                  <>
                    <p className="text-sm text-slate-500 mb-4">
                      Ready to import <strong>{rows.length}</strong> questions
                    </p>
                    <div className="border rounded-xl max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-2 py-2 text-left">Type</th>
                            <th className="px-2 py-2 text-left">Question</th>
                            <th className="px-2 py-2 text-left">Answer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 30).map((r, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-2">{r.type || 'mcq'}</td>
                              <td className="px-2 py-2 truncate max-w-xs">
                                {r.question_text}
                              </td>
                              <td className="px-2 py-2">{r.correct_answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={reset} className="btn-secondary flex-1">
                        Back
                      </button>
                      <button
                        onClick={doImport}
                        disabled={importing}
                        className="btn-primary flex-1"
                      >
                        {importing ? <><Spinner size={16} /> Importing…</> : `Import ${rows.length}`}
                      </button>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                      <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-extrabold text-slate-900">
                      Import complete
                    </h3>
                    <p className="text-slate-500 mt-1">
                      <strong>{importedCount}</strong> questions added
                    </p>
                    <button onClick={handleClose} className="btn-primary w-full mt-6">
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}