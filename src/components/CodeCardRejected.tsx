import { PillBadge } from './PillBadge';
import { useApp } from '../context/AppContext';
import type { ExtractedCode, CodeReview } from '../types';

interface CodeCardRejectedProps {
  code: ExtractedCode;
  review: CodeReview;
}

export function CodeCardRejected({ code, review }: CodeCardRejectedProps) {
  const { dispatch } = useApp();

  function handleUndo() {
    dispatch({ type: 'REVIEW_CODE', codeId: code.id, decision: 'pending' });
  }

  return (
    <div className="border-b border-pheno-border border-l-[3px] border-l-pheno-reject bg-pheno-bg-panel px-4 py-3 opacity-80 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="font-mono text-xs text-pheno-text-tertiary">
            {code.code}
          </span>
          <p className="font-body text-sm font-semibold text-pheno-text-primary line-through">
            {code.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleUndo}
            className="font-body text-xs text-pheno-text-tertiary underline-offset-2 hover:text-pheno-text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring rounded"
          >
            Undo
          </button>
          <PillBadge variant="rejected" />
        </div>
      </div>
      {review.comment && (
        <p className="mt-1 truncate font-body text-xs text-pheno-text-tertiary">
          {review.comment}
        </p>
      )}
    </div>
  );
}
