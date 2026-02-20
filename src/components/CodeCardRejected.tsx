import { PillBadge } from './PillBadge';
import type { ExtractedCode, CodeReview } from '../types';

interface CodeCardRejectedProps {
  code: ExtractedCode;
  review: CodeReview;
}

export function CodeCardRejected({ code, review }: CodeCardRejectedProps) {
  return (
    <div className="border-b border-pheno-border border-l-[3px] border-l-pheno-reject bg-pheno-bg-panel px-4 py-3 opacity-80 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-pheno-text-tertiary">
            {code.code}
          </span>
          <p className="font-body text-sm font-semibold text-pheno-text-primary line-through">
            {code.description}
          </p>
        </div>
        <PillBadge variant="rejected" />
      </div>
      {review.comment && (
        <p className="mt-1 truncate font-body text-xs text-pheno-text-tertiary">
          {review.comment}
        </p>
      )}
    </div>
  );
}
