import { PillBadge } from './PillBadge';
import { useApp } from '../context/AppContext';
import type { ExtractedCode } from '../types';

interface CodeCardAcceptedProps {
  code: ExtractedCode;
}

export function CodeCardAccepted({ code }: CodeCardAcceptedProps) {
  const { dispatch } = useApp();

  function handleUndo() {
    dispatch({ type: 'REVIEW_CODE', codeId: code.id, decision: 'pending' });
  }

  return (
    <div className="border-b border-pheno-border border-l-[3px] border-l-pheno-accent bg-pheno-bg-panel px-4 py-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="font-mono text-xs text-pheno-text-tertiary">
            {code.code}
          </span>
          <p className="font-body text-sm font-semibold text-pheno-text-primary">
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
          <PillBadge variant="accepted" />
        </div>
      </div>
    </div>
  );
}
