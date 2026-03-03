import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePageContext } from '../hooks/usePageContext';
import { submitToEhr } from '../lib/submit';
import { submitCodes } from '../mock/services';

interface ReviewFooterProps {
  selection: Set<string>;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
}

export function ReviewFooter({ selection, onSelectAll, onClearSelection }: ReviewFooterProps) {
  const { state, codes, reviews, encounter, dispatch } = useApp();
  const { isEncounterPage, patientId, encounterId } = usePageContext();
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const reviewed = reviews.size;
  const accepted = Array.from(reviews.values()).filter(
    (r) => r.decision === 'accepted',
  ).length;
  const rejected = Array.from(reviews.values()).filter(
    (r) => r.decision === 'rejected',
  ).length;
  const canSubmit = reviewed > 0 && state === 'review';

  const pendingIds = codes
    .filter((c) => {
      const r = reviews.get(c.id);
      return !r || r.decision === 'pending';
    })
    .map((c) => c.id);

  const targetIds =
    selection.size > 0
      ? Array.from(selection).filter((id) => pendingIds.includes(id))
      : pendingIds;

  const targetCount = targetIds.length;
  const selectionLabel = selection.size > 0 ? `(${targetCount})` : `All (${targetCount})`;

  async function handleSubmit() {
    if (!encounter) return;
    dispatch({ type: 'SUBMIT' });
    try {
      const result =
        isEncounterPage && patientId && encounterId
          ? await submitToEhr(codes, reviews, patientId, encounterId, encounter.existingCodes, encounter.problemListCodes)
          : await submitCodes(codes, encounter.id, reviews);
      dispatch({ type: 'SUBMISSION_COMPLETE', result });
    } catch (error) {
      dispatch({
        type: 'SUBMISSION_FAILED',
        error: error instanceof Error ? error.message : 'Submission failed',
      });
    }
  }

  function handleBulkAccept() {
    if (targetIds.length === 0) return;
    dispatch({ type: 'BULK_REVIEW', codeIds: targetIds, decision: 'accepted' });
    onClearSelection();
  }

  function handleBulkRejectStart() {
    setRejectMode(true);
    setRejectComment('');
  }

  function handleBulkRejectConfirm() {
    if (targetIds.length === 0) return;
    dispatch({
      type: 'BULK_REVIEW',
      codeIds: targetIds,
      decision: 'rejected',
      comment: rejectComment.trim() || undefined,
    });
    setRejectMode(false);
    setRejectComment('');
    onClearSelection();
  }

  function handleBulkRejectCancel() {
    setRejectMode(false);
    setRejectComment('');
  }

  return (
    <div className="sticky bottom-0 border-t border-pheno-border bg-pheno-bg px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {pendingIds.length > 0 && (
        <div className="mb-2">
          {rejectMode ? (
            <>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Rejection comment (optional)"
                rows={2}
                className="mb-2 w-full resize-none rounded border border-pheno-border bg-pheno-bg-panel px-2 py-1.5 font-body text-xs text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:border-pheno-focus-ring focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBulkRejectConfirm}
                  className="rounded-md bg-pheno-reject px-3 py-1.5 font-body text-xs font-medium text-white transition-colors hover:bg-pheno-reject/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
                >
                  Reject {targetCount} {targetCount === 1 ? 'code' : 'codes'}
                </button>
                <button
                  onClick={handleBulkRejectCancel}
                  className="rounded-md border border-pheno-border px-3 py-1.5 font-body text-xs text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  selection.size > 0 ? onClearSelection() : onSelectAll(pendingIds)
                }
                className="font-body text-xs text-pheno-text-tertiary underline-offset-2 hover:text-pheno-text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring rounded"
              >
                {selection.size > 0 ? 'Deselect all' : 'Select all'}
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleBulkAccept}
                  disabled={targetCount === 0}
                  className="rounded-md border border-pheno-accent px-3 py-1.5 font-body text-xs font-medium text-pheno-accent transition-colors hover:bg-pheno-accent hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
                >
                  Accept {selectionLabel}
                </button>
                <button
                  onClick={handleBulkRejectStart}
                  disabled={targetCount === 0}
                  className="rounded-md border border-pheno-reject px-3 py-1.5 font-body text-xs font-medium text-pheno-reject transition-colors hover:bg-pheno-reject hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
                >
                  Reject {selectionLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <p className="mb-2 font-body text-xs text-pheno-text-secondary">
        Reviewed: {reviewed}/{codes.length} · Accepted: {accepted} · Rejected:{' '}
        {rejected}
      </p>
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-md bg-pheno-accent px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
      >
        Submit to Chart
      </button>
    </div>
  );
}
