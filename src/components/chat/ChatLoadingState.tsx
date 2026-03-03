import type { ChatPhase } from '../../types/chat';

const STEP_LABELS: Partial<Record<ChatPhase, string>> = {
  capturing: 'Capturing screen\u2026',
  extracting_fhir: 'Extracting clinical data\u2026',
  summarizing: 'Generating IPS summary\u2026',
};

interface Props {
  phase: ChatPhase;
}

export function ChatLoadingState({ phase }: Props) {
  const label = STEP_LABELS[phase] ?? 'Processing\u2026';

  const steps: ChatPhase[] = ['capturing', 'extracting_fhir', 'summarizing'];
  const currentIdx = steps.indexOf(phase);

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      {/* Progress bar */}
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-pheno-bg-secondary">
        <div className="h-full animate-progress rounded-full bg-pheno-accent" />
      </div>

      {/* Spinning diamond + label */}
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block animate-spin-slow text-2xl text-pheno-accent">
          &#9671;
        </span>
        <p className="font-body text-sm text-pheno-text-secondary">{label}</p>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i <= currentIdx ? 'bg-pheno-accent' : 'bg-pheno-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
