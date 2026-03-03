export type AppMode = 'extraction' | 'chat';

interface Props {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  const tabs: Array<{ value: AppMode; label: string }> = [
    { value: 'extraction', label: 'Code Extraction' },
    { value: 'chat', label: 'Agent Chat' },
  ];

  return (
    <div className="flex border-b border-pheno-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 py-2.5 font-body text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring ${
            mode === tab.value
              ? 'border-b-2 border-pheno-accent text-pheno-accent'
              : 'text-pheno-text-tertiary hover:text-pheno-text-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
