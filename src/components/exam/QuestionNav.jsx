export default function QuestionNav({ questions, answers, flagged, current, onJump }) {
  return (
    <div className="glass rounded-2xl p-5 sticky top-24">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
        Questions
      </p>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined && answers[q.id] !== '';
          const isFlagged = !!flagged[q.id];
          const isCurrent = i === current;

          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={`aspect-square rounded-lg text-xs font-bold transition ${
                isCurrent
                  ? 'ring-2 ring-brand-500 ring-offset-1'
                  : ''
              } ${
                isFlagged
                  ? 'bg-amber-400 text-white'
                  : answered
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5 text-xs">
        <Legend color="bg-emerald-500" label="Answered" />
        <Legend color="bg-amber-400" label="Flagged" />
        <Legend color="bg-slate-100" label="Not answered" />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-700">
            {Object.keys(answers).filter((k) => answers[k] !== '' && answers[k] !== undefined).length} / {questions.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-slate-500">{label}</span>
    </div>
  );
}