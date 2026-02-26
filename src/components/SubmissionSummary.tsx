import { useApp } from '../context/AppContext';

export function SubmissionSummary() {
  const { submission, dispatch } = useApp();

  if (!submission) return null;

  const timestamp = new Date(submission.submittedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Demo mode banner */}
      {submission.mode === 'demo' && (
        <div className="border-b border-pheno-border bg-pheno-bg-panel px-4 py-2">
          <p className="font-body text-xs text-pheno-text-secondary">
            Demo mode — no data was written to any EHR.
          </p>
        </div>
      )}

      {/* Partial write failure notice */}
      {submission.notice && (
        <div className="border-b border-pheno-reject/20 bg-pheno-reject/5 px-4 py-2">
          <p className="font-body text-xs text-pheno-reject">{submission.notice}</p>
        </div>
      )}

      {/* Diamond icon + heading */}
      <div className="flex flex-col items-center px-4 pt-8 pb-4">
        <span className="mb-3 text-3xl animate-in zoom-in duration-400">
          ◇
        </span>
        <h2 className="font-heading text-lg text-pheno-text-primary">
          Codes submitted to chart
        </h2>
        <p className="mt-1 font-body text-xs text-pheno-text-tertiary">
          {submission.accepted.length} accepted ·{' '}
          {submission.rejected.length} rejected
        </p>
      </div>

      {/* Summary list */}
      <div className="mx-4 rounded-md border border-pheno-border bg-pheno-bg-panel">
        {submission.accepted.map((code, i) => (
          <div
            key={code.id}
            className="flex items-center gap-2 border-b border-pheno-border px-3 py-2 last:border-b-0 animate-in fade-in duration-200"
            style={{
              animationDelay: `${i * 40}ms`,
              animationFillMode: 'both',
            }}
          >
            <span className="font-body text-xs font-medium text-pheno-accent">
              ✓
            </span>
            <span className="font-mono text-xs text-pheno-text-tertiary">
              {code.code}
            </span>
            <span className="font-body text-xs text-pheno-text-primary">
              {code.description}
            </span>
          </div>
        ))}
        {submission.rejected.map(({ code, comment }, i) => (
          <div
            key={code.id}
            className="border-b border-pheno-border px-3 py-2 last:border-b-0 animate-in fade-in duration-200"
            style={{
              animationDelay: `${(submission.accepted.length + i) * 40}ms`,
              animationFillMode: 'both',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-body text-xs font-medium text-pheno-text-tertiary">
                ✗
              </span>
              <span className="font-mono text-xs text-pheno-text-tertiary">
                {code.code}
              </span>
              <span className="font-body text-xs text-pheno-text-tertiary line-through">
                {code.description}
              </span>
            </div>
            {comment && (
              <p className="ml-5 mt-0.5 truncate font-body text-xs text-pheno-text-tertiary">
                {comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <p className="mt-3 text-center font-mono text-xs text-pheno-text-tertiary">
        Submitted {timestamp}
      </p>

      {/* Review Another button */}
      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleReset}
          className="w-full rounded-md border border-pheno-border px-4 py-2.5 font-body text-sm font-medium text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
        >
          Review Another
        </button>
      </div>

      {/* Powered by footer */}
      <p className="pb-4 text-center font-body text-[10px] text-pheno-text-tertiary">
        Powered by PhenoML Construe API
      </p>
    </div>
  );
}
