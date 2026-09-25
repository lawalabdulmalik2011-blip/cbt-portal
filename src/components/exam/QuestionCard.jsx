export default function QuestionCard({ question, value, onChange, onFlag, flagged }) {
  if (!question) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="badge bg-slate-100 text-slate-600">
          {question.type.replace('_', '/').toUpperCase()}
        </span>
        <button
          onClick={onFlag}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
            flagged
              ? 'bg-amber-100 text-amber-700'
              : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          {flagged ? '⚑ Flagged' : '⚐ Flag for review'}
        </button>
      </div>

      <p className="text-lg text-slate-900 leading-relaxed whitespace-pre-wrap">
        {question.question_text}
      </p>

      {question.question_image_url && (
        <img
          src={question.question_image_url}
          alt="Question"
          className="mt-4 max-h-72 rounded-xl border border-slate-200"
        />
      )}

      {/* Answer input */}
      <div className="mt-6">
        {question.type === 'mcq' && (
          <div className="space-y-2">
            {question.options?.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => onChange(o.key)}
                className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                  value === o.key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    value === o.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {o.key}
                </span>
                <span className="text-slate-800">{o.text}</span>
              </button>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-3">
            {['true', 'false'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`p-4 rounded-xl border-2 font-semibold capitalize transition ${
                  value === v
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {question.type === 'short_answer' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer…"
            className="input"
          />
        )}

        {question.type === 'essay' && (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer…"
            rows={8}
            className="input resize-none"
          />
        )}
      </div>
    </div>
  );
}