import { motion } from 'framer-motion';
import {
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const TYPE_LABEL = {
  mcq: 'MCQ',
  true_false: 'True/False',
  short_answer: 'Short',
  essay: 'Essay',
};

const TYPE_COLOR = {
  mcq: 'bg-brand-100 text-brand-700',
  true_false: 'bg-emerald-100 text-emerald-700',
  short_answer: 'bg-amber-100 text-amber-700',
  essay: 'bg-rose-100 text-rose-700',
};

const DIFFICULTY_COLOR = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-rose-100 text-rose-700',
};

export default function QuestionList({ questions, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-slate-500">
          No questions yet. Click <strong>New question</strong> to add your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02 }}
          className="glass rounded-2xl p-5 hover:shadow-md transition group"
        >
          <div className="flex gap-4">
            {/* Image thumbnail */}
            {q.question_image_url && (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                  src={q.question_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`badge ${TYPE_COLOR[q.type]}`}>
                  {TYPE_LABEL[q.type]}
                </span>
                <span className={`badge ${DIFFICULTY_COLOR[q.difficulty]}`}>
                  Lvl {q.difficulty}
                </span>
                {q.topic && (
                  <span className="badge bg-slate-100 text-slate-600">
                    {q.topic}
                  </span>
                )}
                <span className="badge bg-slate-100 text-slate-600">
                  {q.points} pt{q.points > 1 ? 's' : ''}
                </span>
                {q.question_image_url && (
                  <span title="Has image">
                    <PhotoIcon className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                )}
              </div>

              <p className="text-slate-800 font-medium leading-snug line-clamp-2">
                {q.question_text}
              </p>

              {q.type === 'mcq' && q.options?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <span
                      key={o.key}
                      className={`text-xs px-2 py-1 rounded-lg ${
                        o.key === q.correct_answer
                          ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {o.key}. {o.text}
                    </span>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold">
                  Answer: {q.correct_answer}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onEdit(q)}
                className="p-2 rounded-lg text-brand-600 hover:bg-brand-50"
                title="Edit"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(q)}
                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}