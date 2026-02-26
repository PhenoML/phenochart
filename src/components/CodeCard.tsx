import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RejectionComment } from './RejectionComment';
import type { ExtractedCode } from '../types';

interface CodeCardProps {
  code: ExtractedCode;
  index: number;
  selected?: boolean;
  onToggle?: () => void;
}

export function CodeCard({ code, index, selected = false, onToggle }: CodeCardProps) {
  const { dispatch } = useApp();
  const [rejecting, setRejecting] = useState(false);

  function handleAccept() {
    dispatch({ type: 'REVIEW_CODE', codeId: code.id, decision: 'accepted' });
  }

  function handleRejectClick() {
    setRejecting(true);
  }

  function handleRejectDone(comment: string) {
    dispatch({
      type: 'REVIEW_CODE',
      codeId: code.id,
      decision: 'rejected',
      comment: comment || undefined,
    });
  }

  function handleRejectSkip() {
    dispatch({ type: 'REVIEW_CODE', codeId: code.id, decision: 'rejected' });
  }

  function handleRejectCancel() {
    setRejecting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (rejecting) return;
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      handleAccept();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      handleRejectClick();
    }
  }

  return (
    <div
      role="article"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`border-b border-pheno-border bg-pheno-bg-panel px-4 py-3 animate-in fade-in duration-300 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pheno-focus-ring ${rejecting ? 'border-l-[3px] border-l-pheno-reject' : ''}`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="mb-1 flex items-center gap-2">
        {onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${code.code}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-pheno-accent"
          />
        )}
        <span className="font-mono text-xs text-pheno-text-tertiary">
          {code.code}
        </span>
      </div>
      <p className="mb-2 font-body text-sm font-semibold text-pheno-text-primary">
        {code.description}
      </p>

      {code.citations[0] && (
        <div className="mb-2 border-l-2 border-pheno-citation-border pl-2">
          <p className="font-body text-xs italic text-pheno-text-secondary">
            &ldquo;{code.citations[0].text}&rdquo;
          </p>
        </div>
      )}

      <p className="mb-3 font-body text-xs text-pheno-text-secondary">
        {code.reason}
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={rejecting}
          aria-label={`Accept ${code.code} ${code.description}`}
          className="rounded-md border border-pheno-accent px-3 py-1.5 font-body text-xs font-medium text-pheno-accent transition-all duration-150 hover:scale-[1.02] hover:bg-pheno-accent hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
        >
          Accept
        </button>
        <button
          onClick={handleRejectClick}
          disabled={rejecting}
          aria-label={`Reject ${code.code} ${code.description}`}
          className="rounded-md border border-pheno-reject px-3 py-1.5 font-body text-xs font-medium text-pheno-reject transition-all duration-150 hover:scale-[1.02] hover:bg-pheno-reject hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
        >
          Reject
        </button>
      </div>

      <RejectionComment
        open={rejecting}
        onDone={handleRejectDone}
        onSkip={handleRejectSkip}
        onCancel={handleRejectCancel}
      />
    </div>
  );
}
