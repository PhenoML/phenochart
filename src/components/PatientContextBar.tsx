import { useApp } from '../context/AppContext';

export function PatientContextBar() {
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
        <span className="font-mono text-xs text-pheno-text-tertiary">{date}</span>
      </div>
      <p className="mt-0.5 font-body text-xs text-pheno-text-tertiary">{type}</p>
    </div>
  );
}
