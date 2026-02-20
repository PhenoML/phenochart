import { useEffect, useRef, useState } from 'react';

interface RejectionCommentProps {
  open: boolean;
  onDone: (comment: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function RejectionComment({
  open,
  onDone,
  onSkip,
  onCancel,
}: RejectionCommentProps) {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setComment('');
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  return (
    <div
      className="grid transition-[grid-template-rows] duration-250 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className="px-4 pb-3 pt-1">
          <label htmlFor="rejection-reason" className="mb-1 block font-body text-xs text-pheno-text-secondary">
            Why are you rejecting?
          </label>
          <textarea
            id="rejection-reason"
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-pheno-border bg-white px-3 py-2 font-body text-xs text-pheno-text-primary shadow-inner placeholder:text-pheno-text-tertiary focus:border-pheno-reject focus:outline-none"
            placeholder="Optional reason..."
          />
          <div className="mt-1.5 flex gap-2">
            <button
              onClick={() => onSkip()}
              className="rounded-md px-3 py-1 font-body text-xs text-pheno-text-secondary transition-colors hover:text-pheno-text-primary"
            >
              Skip
            </button>
            <button
              onClick={() => onDone(comment)}
              className="rounded-md bg-pheno-reject px-3 py-1 font-body text-xs font-medium text-white transition-colors hover:bg-pheno-reject/90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
