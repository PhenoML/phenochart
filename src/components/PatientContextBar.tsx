import { useApp } from '../context/AppContext';

function GearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface Props {
  onOpenSettings: () => void;
}

export function PatientContextBar({ onOpenSettings }: Props) {
  const { encounter } = useApp();
  if (!encounter) return null;

  const { patient, date, type } = encounter;

  return (
    <div className="sticky top-0 z-10 border-b border-pheno-border bg-pheno-bg px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-semibold text-pheno-text-primary">
            {patient.name}
          </span>
          <span className="rounded-full bg-pheno-bg-secondary px-2 py-0.5 font-mono text-xs text-pheno-text-secondary">
            {patient.age}{patient.sex}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-pheno-text-tertiary">{date}</span>
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="rounded text-pheno-text-tertiary transition-colors hover:text-pheno-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            <GearIcon />
          </button>
        </div>
      </div>
      <p className="mt-0.5 font-body text-xs text-pheno-text-tertiary">{type}</p>
    </div>
  );
}
