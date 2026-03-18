interface Props {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-pheno-border px-4 py-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="rounded-full border border-pheno-border bg-pheno-bg-panel px-3 py-1.5 font-body text-xs text-pheno-text-secondary transition-colors hover:border-pheno-accent hover:text-pheno-accent disabled:opacity-40"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
