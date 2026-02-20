import { useApp } from '../context/AppContext';
import { submitCodes } from '../mock/services';

export function ReviewFooter() {
  const { state, codes, reviews, encounter, dispatch } = useApp();

  const reviewed = reviews.size;
  const accepted = Array.from(reviews.values()).filter(
    (r) => r.decision === 'accepted',
  ).length;
  const rejected = Array.from(reviews.values()).filter(
    (r) => r.decision === 'rejected',
  ).length;
  const canSubmit = reviewed > 0 && state === 'review';

  async function handleSubmit() {
    if (!encounter) return;
    dispatch({ type: 'SUBMIT' });
    try {
      const result = await submitCodes(encounter.id, reviews);
      dispatch({ type: 'SUBMISSION_COMPLETE', result });
    } catch (error) {
      dispatch({
        type: 'SUBMISSION_FAILED',
        error: error instanceof Error ? error.message : 'Submission failed',
      });
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-pheno-border bg-pheno-bg px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
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
