import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { parseCSV, downloadCSV, SAMPLE_CSV } from '../../lib/csv';
import { createUser, nextExamNumber } from '../../lib/admin';
import Spinner from '../ui/Spinner.jsx';
import RoleBadge from './RoleBadge.jsx';

export default function BulkImportModal({ open, onClose, onImported }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [role, setRole] = useState('student');
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: [] });
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function reset() {
    setStep('upload');
    setRole('student');
    setRows([]);
    setProgress({ done: 0, total: 0, failed: [] });
    setResults([]);
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
      if (!parsed[0].full_name) {
        throw new Error('CSV must have a "full_name" column');
      }

      setRows(parsed);
      setStep('preview');
    } catch (err) {
      toast.error(err.message || 'Failed to parse CSV');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function runImport() {
    setStep('importing');
    const total = rows.length;
    setProgress({ done: 0, total, failed: [] });

    const created = [];
    const failed = [];

    // Get the starting exam number for this role
    let baseNumber = await nextExamNumber(role);
    let baseIndex = parseInt(baseNumber.split('/').pop(), 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const year = new Date().getFullYear();
      const prefix = { student: 'STU', teacher: 'TCH', admin: 'ADM' }[role];

      const examNumber = `${prefix}/${year}/${String(baseIndex + i).padStart(3, '0')}`;

      try {
        const res = await createUser({
          exam_number: examNumber,
          full_name: row.full_name,
          role,
          class_level: row.class_level || undefined,
          subject_specialty: row.subject_specialty || undefined,
        });

        created.push({
          full_name: res.user.full_name,
          exam_number: res.user.exam_number,
          password: res.password,
          role: res.user.role,
          class_level: res.user.class_level || '',
          subject_specialty: res.user.subject_specialty || '',
        });
      } catch (err) {
        failed.push({ row, error: err.message });
      }

      setProgress({ done: i + 1, total, failed });
    }

    setResults(created);
    setProgress((p) => ({ ...p, failed }));
    setStep('done');
    onImported?.();
  }

  function downloadResults() {
    if (!results.length) return;
    downloadCSV(
      results.map((r) => ({
        full_name: r.full_name,
        exam_number: r.exam_number,
        password: r.password,
        role: r.role,
        class_level: r.class_level,
      })),
      `exampro-credentials-${Date.now()}.csv`
    );
    toast.success('Credentials downloaded');
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exampro-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">
                    Bulk import
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    Onboard a whole class in one click
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {step === 'upload' && (
                  <UploadStep
                    role={role}
                    setRole={setRole}
                    dragOver={dragOver}
                    setDragOver={setDragOver}
                    onDrop={handleDrop}
                    onPickFile={() => fileInputRef.current?.click()}
                    onDownloadSample={downloadSample}
                  />
                )}

                {step === 'preview' && (
                  <PreviewStep
                    rows={rows}
                    role={role}
                    onBack={reset}
                    onImport={runImport}
                  />
                )}

                {step === 'importing' && (
                  <ImportingStep progress={progress} />
                )}

                {step === 'done' && (
                  <DoneStep
                    results={results}
                    progress={progress}
                    onDownload={downloadResults}
                    onClose={handleClose}
                  />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// STEPS
// ============================================

function UploadStep({ role, setRole, dragOver, setDragOver, onDrop, onPickFile, onDownloadSample }) {
  return (
    <div className="space-y-6">
      {/* Role */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Importing
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                role === r
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={onPickFile}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
        }`}
      >
        <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700">
          Drop your CSV here, or click to browse
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Must include <code className="font-mono">full_name</code> column
          {role === 'student' && (
            <>
              {' '}+ optional <code className="font-mono">class_level</code>
            </>
          )}
        </p>
      </div>

      {/* Template */}
      <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-700 text-sm">Need a template?</p>
          <p className="text-xs text-slate-400">
            Download a sample CSV with the right columns
          </p>
        </div>
        <button onClick={onDownloadSample} className="btn-secondary text-sm py-2">
          <DocumentArrowDownIcon className="w-4 h-4" />
          Template
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ rows, role, onBack, onImport }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Ready to import <span className="font-bold text-slate-700">{rows.length}</span>{' '}
          {role} accounts
        </p>
        <span className="badge-info">{rows.length} rows</span>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-left text-xs text-slate-500 uppercase">
              <th className="px-3 py-2">Full name</th>
              <th className="px-3 py-2">Class</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">{r.full_name}</td>
                <td className="px-3 py-2 text-slate-500">{r.class_level || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 50 && (
          <p className="text-center text-xs text-slate-400 py-2">
            …and {rows.length - 50} more
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="btn-secondary flex-1">
          Back
        </button>
        <button onClick={onImport} className="btn-primary flex-1">
          Import {rows.length} users
        </button>
      </div>
    </div>
  );
}

function ImportingStep({ progress }) {
  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <Spinner size={48} className="mx-auto" />
        <p className="font-display text-xl font-bold text-slate-900 mt-4">
          Creating users…
        </p>
        <p className="text-slate-500 mt-1">
          {progress.done} of {progress.total}
        </p>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
        />
      </div>
    </div>
  );
}

function DoneStep({ results, progress, onDownload, onClose }) {
  const failed = progress.failed ?? [];
  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
          <CheckCircleIcon className="w-9 h-9 text-white" />
        </div>
        <h3 className="font-display text-2xl font-extrabold text-slate-900">
          Import complete
        </h3>
        <p className="text-slate-500 mt-1">
          <span className="text-emerald-600 font-bold">{results.length}</span> created
          {failed.length > 0 && (
            <>
              {' · '}
              <span className="text-rose-600 font-bold">{failed.length}</span> failed
            </>
          )}
        </p>
      </div>

      {failed.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
            <p className="font-semibold text-rose-700 text-sm">Failed rows</p>
          </div>
          <ul className="text-xs text-rose-600 space-y-1 max-h-32 overflow-y-auto">
            {failed.slice(0, 10).map((f, i) => (
              <li key={i}>
                {f.row.full_name}: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        {results.length > 0 && (
          <button onClick={onDownload} className="btn-secondary flex-1">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Download credentials
          </button>
        )}
        <button onClick={onClose} className="btn-primary flex-1">
          Done
        </button>
      </div>
    </div>
  );
}