import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getOrCreateAttempt,
  loadExamForStudent,
  loadAnswers,
  submitAttempt,
} from '../../lib/attempts';
import { useExamGuard, MAX_VIOLATIONS_ALLOWED } from '../../hooks/useExamGuard';
import { useOfflineSave } from '../../hooks/useOfflineSave';
import Timer from '../../components/exam/Timer.jsx';
import QuestionCard from '../../components/exam/QuestionCard.jsx';
import QuestionNav from '../../components/exam/QuestionNav.jsx';
import ViolationBanner from '../../components/exam/ViolationBanner.jsx';
import LockoutScreen from '../../components/exam/LockoutScreen.jsx';
import SecurityHUD from '../../components/exam/SecurityHUD.jsx';
import EnterFullscreenGate from '../../components/exam/EnterFullscreenGate.jsx';
import SubmitConfirmation from '../../components/exam/SubmitConfirmation.jsx';
import ExamCompletedScreen from '../../components/exam/ExamCompletedScreen.jsx';
import OfflineBanner from '../../components/exam/OfflineBanner.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamRunnerPage() {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState('gate');
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [wasFlagged, setWasFlagged] = useState(false);

  const [completedInfo, setCompletedInfo] = useState(null);

  const [violation, setViolation] = useState(null);
  const [violations, setViolations] = useState(0);
  const [lockout, setLockout] = useState(null);

  const persistRef = useRef({ answers, flagged });
  const submittedRef = useRef(false);
  const blockNavigationRef = useRef(false);

  // Offline-aware save
  const {
    save: saveOffline,
    queuedCount,
    syncing,
    online,
  } = useOfflineSave(attempt?.id);

  useEffect(() => {
    persistRef.current = { answers, flagged };
  }, [answers, flagged]);

  // ============================================
  // NAVIGATION LOCK
  // ============================================
  useEffect(() => {
    if (!submitted) return;
    blockNavigationRef.current = true;
    window.history.pushState(null, '', window.location.href);

    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
      toast.error('This exam has been submitted. Use the buttons to navigate.');
    };

    window.addEventListener('popstate', blockBack);
    return () => {
      window.removeEventListener('popstate', blockBack);
      blockNavigationRef.current = false;
    };
  }, [submitted]);

  useExamGuard(attempt?.id, stage === 'running' && !submitted, {
    onViolation: (count, reason) => {
      setViolations(count);
      setViolation({ count, reason });
      if (count < MAX_VIOLATIONS_ALLOWED) {
        setTimeout(() => setViolation(null), 4000);
      }
    },
    onLockout: (reason) => {
      setLockout({ reason });
      setTimeout(() => doSubmit(true, true), 500);
    },
  });

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        const loadedExam = await loadExamForStudent(examId);

        const now = Date.now();
        if (loadedExam.start_at && new Date(loadedExam.start_at).getTime() > now) {
          toast.error('This exam has not started yet');
          navigate('/student');
          return;
        }
        if (loadedExam.end_at && new Date(loadedExam.end_at).getTime() < now) {
          toast.error('This exam has ended');
          navigate('/student');
          return;
        }

        const att = await getOrCreateAttempt(examId, user.id);

        if (att.status === 'submitted' && !loadedExam.allow_retake) {
          setExam(loadedExam);
          setAttempt(att);
          setCompletedInfo({
            examTitle: loadedExam.title,
            score: att.score,
            passed: att.passed,
            submittedAt: att.submitted_at,
          });
          setStage('completed');
          setLoading(false);
          return;
        }

        if (att.is_flagged) {
          setExam(loadedExam);
          setAttempt(att);
          setCompletedInfo({
            examTitle: loadedExam.title,
            score: att.score,
            passed: false,
            submittedAt: att.submitted_at,
          });
          setStage('completed');
          setLoading(false);
          return;
        }

        setViolations(att.violations ?? 0);

        let qs = loadedExam.questions;
        if (loadedExam.shuffle_questions) qs = shuffle(qs);

        setExam(loadedExam);
        setAttempt(att);
        setQuestions(qs);

        const saved = await loadAnswers(att.id);
        const answerMap = {};
        const flagMap = {};
        saved.forEach((a) => {
          if (a.answer !== null && a.answer !== undefined) answerMap[a.question_id] = a.answer;
          if (a.flagged) flagMap[a.question_id] = true;
        });
        setAnswers(answerMap);
        setFlagged(flagMap);

        if (att.current_question_index > 0 && att.current_question_index < qs.length) {
          setCurrent(att.current_question_index);
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to load exam');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, user, navigate]);

  // ============================================
  // AUTO SAVE (offline-aware)
  // ============================================
  useEffect(() => {
    if (stage !== 'running' || !attempt || submitted) return;
    const interval = setInterval(async () => {
      const { answers: a } = persistRef.current;
      for (const qid of Object.keys(a)) {
        await saveOffline({
          attemptId: attempt.id,
          questionId: qid,
          answer: a[qid],
        });
      }
      // Save progress index only when online
      if (online) {
        try {
          await supabase
            .from('attempts')
            .update({ current_question_index: current })
            .eq('id', attempt.id);
        } catch (_) {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [attempt, submitted, stage, current, saveOffline, online]);

  // ============================================
  // ENTER FULLSCREEN
  // ============================================
  const handleEnter = useCallback(async () => {
    setStarting(true);
    try {
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    } catch (_) {
      toast.error('Please allow fullscreen — required for the exam');
    }
    setStage('running');
    setStarting(false);
  }, []);

  // ============================================
  // SUBMIT
  // ============================================
  async function doSubmit(auto = false, flagged = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      for (const qid of Object.keys(answers)) {
        await saveOffline({
          attemptId: attempt.id,
          questionId: qid,
          answer: answers[qid],
        });
      }

      const result = await submitAttempt(attempt.id);
      setSubmitted(true);
      setWasFlagged(flagged);
      setSubmittedResult(result);
      setStage('submitted');

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch (err) {
      toast.error(
        err.message ||
          'Submit failed — check your internet connection and try again'
      );
      setSubmitting(false);
      submittedRef.current = false;
    }
  }

  function handleSubmitClick() {
    const answered = Object.keys(answers).filter(
      (k) => answers[k] !== '' && answers[k] !== undefined
    ).length;
    const unanswered = questions.length - answered;
    const msg =
      unanswered > 0
        ? `${unanswered} question(s) unanswered. Submit anyway?`
        : 'Submit your exam now?';
    if (!confirm(msg)) return;
    doSubmit(false, false);
  }

  // ============================================
  // RENDERS
  // ============================================

  if (lockout) return <LockoutScreen reason={lockout.reason} submitting={submitting} />;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Spinner size={48} />
        <p className="text-slate-500 font-medium">Preparing secure exam room…</p>
      </div>
    );
  }

  if (stage === 'completed' && completedInfo) {
    return (
      <ExamCompletedScreen
        examTitle={completedInfo.examTitle}
        score={completedInfo.score}
        passed={completedInfo.passed}
        submittedAt={completedInfo.submittedAt}
      />
    );
  }

  if (!exam || !questions.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">No questions in this exam.</p>
      </div>
    );
  }

  if (stage === 'submitted') {
    return (
      <SubmitConfirmation
        exam={exam}
        result={submittedResult}
        flagged={wasFlagged}
        onHome={(to) => {
          blockNavigationRef.current = false;
          if (to === 'results') navigate('/student/results');
          else navigate('/student');
        }}
      />
    );
  }

  if (stage === 'gate') {
    return <EnterFullscreenGate exam={exam} onEnter={handleEnter} starting={starting} />;
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== '' && answers[k] !== undefined
  ).length;
  const progressPct = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 exam-lockdown">
      <ViolationBanner violation={violation} maxViolations={MAX_VIOLATIONS_ALLOWED} />
      <OfflineBanner online={online} queuedCount={queuedCount} syncing={syncing} />

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-xs font-bold">EX</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-slate-900 truncate text-sm sm:text-base">
                  {exam.title}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Question {current + 1} of {questions.length}
                </p>
              </div>
              <div className="hidden sm:block ml-2">
                <SecurityHUD violations={violations} maxViolations={MAX_VIOLATIONS_ALLOWED} />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Timer
                durationMinutes={exam.duration_minutes}
                startedAt={attempt.started_at}
                onExpire={() => doSubmit(true, false)}
              />
              <button onClick={handleSubmitClick} disabled={submitting} className="btn-danger text-sm">
                {submitting ? (
                  <><Spinner size={16} /><span className="hidden sm:inline">Submitting…</span></>
                ) : (
                  <><PaperAirplaneIcon className="w-4 h-4" /><span className="hidden sm:inline">Submit</span></>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <QuestionCard
                question={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                onFlag={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
                flagged={!!flagged[q.id]}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>

            <div className="text-xs text-slate-500 hidden sm:block">
              {online ? 'Auto-saved' : 'Saving locally'}
            </div>

            {current === questions.length - 1 ? (
              <button onClick={handleSubmitClick} disabled={submitting} className="btn-primary">
                <CheckCircleIcon className="w-4 h-4" />
                Review & Submit
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="btn-primary"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <QuestionNav
            questions={questions}
            answers={answers}
            flagged={flagged}
            current={current}
            onJump={setCurrent}
          />

          <div className="glass rounded-2xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FlagIcon className="w-4 h-4 text-brand-600" />
              <p className="text-xs font-bold text-slate-700">Exam rules</p>
            </div>
            <ul className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
              <li>• Do not switch tabs or windows</li>
              <li>• Do not exit fullscreen</li>
              <li>• Do not right-click or copy</li>
              <li>• Do not use keyboard shortcuts</li>
              <li className="text-rose-600 font-medium">• 3 violations = auto-submit</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}