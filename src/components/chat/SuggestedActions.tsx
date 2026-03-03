const DEFAULT_ACTIONS = [
  { label: 'Draft Prior Auth Rationale', prompt: 'Draft a prior authorization rationale letter based on this clinical summary.' },
  { label: 'Patient Take-Home Instructions', prompt: 'Draft patient take-home instructions based on this clinical summary.' },
  { label: 'Summarize Key Findings', prompt: 'Provide a concise summary of the key clinical findings and recommended next steps.' },
];

interface Props {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedActions({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {DEFAULT_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="rounded-full border border-pheno-border px-3 py-1.5 font-body text-xs text-pheno-accent transition-colors hover:border-pheno-accent hover:bg-pheno-accent-light disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
