export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      {/* Progress bar */}
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-pheno-bg-secondary">
        <div className="h-full animate-progress rounded-full bg-pheno-accent" />
      </div>

      {/* Rotating diamond + label */}
      <div className="flex flex-col items-center gap-2">
        <span className="inline-block animate-spin-slow text-2xl text-pheno-accent">
          &#9671;
        </span>
        <p className="font-body text-sm text-pheno-text-secondary">
          Extracting codes&hellip;
        </p>
        <p className="font-mono text-xs text-pheno-text-tertiary">
          ICD-10-CM &middot; RXNORM
        </p>
      </div>
    </div>
  );
}
