import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { computeReportStats, GRADE_SCALE } from '../../lib/reportCards';

export default function ReportCardViewer({ open, onClose, report }) {
  if (!report) return null;

  const student = report.student;
  const scores = report.scores ?? [];
  const stats = computeReportStats(scores);

  function handlePrint() {
    window.print();
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
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl print:hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 pointer-events-none overflow-y-auto print:p-0 print:block print:static print:bg-white"
          >
            <div className="w-full max-w-3xl my-8 pointer-events-auto print:my-0 print:max-w-none">
              <div className="relative rounded-[28px] shadow-2xl overflow-hidden bg-white backdrop-blur-2xl print:rounded-none print:shadow-none">
                {/* Gradient top bar */}
                <div className="h-1.5 bg-gradient-to-r from-brand-500 via-accent-500 to-pink-500 print:hidden" />

                {/* Action buttons — hidden on print */}
                <div className="absolute top-4 right-4 flex gap-2 z-10 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl bg-white/90 backdrop-blur border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-md"
                    title="Print / Save as PDF"
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-white/90 backdrop-blur border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-md"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Header */}
                <div className="px-8 py-8 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white print:bg-white print:text-slate-900">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xs">
                          EP
                        </div>
                        <p className="text-xs uppercase tracking-widest font-bold text-white/80 print:text-slate-500">
                          ExamPro · Report Card
                        </p>
                      </div>
                      <h1 className="font-display text-3xl font-extrabold mt-2">
                        {student?.full_name ?? 'Student'}
                      </h1>
                      <p className="text-white/80 font-mono text-sm mt-1 print:text-slate-600">
                        {student?.exam_number} · {report.class_level}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest font-bold text-white/70 print:text-slate-500">
                        Session
                      </p>
                      <p className="font-display text-xl font-extrabold">
                        {report.session}
                      </p>
                      <p className="text-sm text-white/80 print:text-slate-600 mt-1">
                        {report.term} Term
                      </p>
                    </div>
                  </div>

                  {/* Quick stats in header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <HeaderStat label="Average" value={`${stats.average}%`} />
                    <HeaderStat label="Total" value={stats.total} />
                    <HeaderStat label="Subjects" value={stats.subjects} />
                    <HeaderStat
                      label="Attendance"
                      value={
                        report.attendance_total > 0
                          ? `${Math.round(
                              (report.attendance_present / report.attendance_total) * 100
                            )}%`
                          : '—'
                      }
                    />
                  </div>
                </div>

                {/* Scores table */}
                <div className="p-8">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b-2 border-slate-200">
                        <th className="py-3 font-bold">Subject</th>
                        <th className="py-3 font-bold text-center w-16">CA</th>
                        <th className="py-3 font-bold text-center w-16">Exam</th>
                        <th className="py-3 font-bold text-center w-20">Total</th>
                        <th className="py-3 font-bold text-center w-16">Grade</th>
                        <th className="py-3 font-bold text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((s, i) => (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 ${
                            i % 2 === 0 ? 'bg-slate-50/40' : ''
                          }`}
                        >
                          <td className="py-3 font-semibold text-slate-800 text-sm">
                            {s.subject}
                          </td>
                          <td className="py-3 text-center text-sm text-slate-600">
                            {s.ca ?? 0}
                          </td>
                          <td className="py-3 text-center text-sm text-slate-600">
                            {s.exam ?? 0}
                          </td>
                          <td className="py-3 text-center font-bold text-slate-800">
                            {s.total ?? 0}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                (s.total ?? 0) >= 50
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : (s.total ?? 0) >= 40
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {s.grade ?? 'F9'}
                            </span>
                          </td>
                          <td className="py-3 text-right text-sm text-slate-600">
                            {s.remark ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Comments */}
                  <div className="mt-8 space-y-4">
                    {report.teacher_comment && (
                      <CommentBlock
                        label="Class teacher's comment"
                        text={report.teacher_comment}
                        color="brand"
                      />
                    )}
                    {report.principal_comment && (
                      <CommentBlock
                        label="Principal's comment"
                        text={report.principal_comment}
                        color="emerald"
                      />
                    )}
                  </div>

                  {/* Footer info */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-500">
                    <div>
                      {report.next_term_begins && (
                        <>
                          <span className="font-semibold text-slate-700">
                            Next term begins:{' '}
                          </span>
                          {new Date(report.next_term_begins).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {report.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircleIcon className="w-4 h-4" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                          <ClockIcon className="w-4 h-4" />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grade scale legend */}
                  <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                      Grading scale
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {GRADE_SCALE.map((g) => (
                        <span
                          key={g.grade}
                          className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono"
                        >
                          <strong>{g.grade}</strong> {g.min}+
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Print CSS */}
          <style>{`
            @media print {
              @page { size: A4; margin: 12mm; }
              body * { visibility: hidden; }
              .print-report, .print-report * { visibility: visible; }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

function HeaderStat({ label, value }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 print:bg-slate-100">
      <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 print:text-slate-500">
        {label}
      </p>
      <p className="font-display text-lg font-extrabold leading-tight">{value}</p>
    </div>
  );
}

function CommentBlock({ label, text, color = 'brand' }) {
  const colors = {
    brand: 'from-brand-50 to-brand-100/40 border-brand-100 text-brand-900',
    emerald: 'from-emerald-50 to-emerald-100/40 border-emerald-100 text-emerald-900',
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${colors[color]}`}>
      <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">
        {label}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}