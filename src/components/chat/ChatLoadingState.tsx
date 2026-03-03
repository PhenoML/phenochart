import { useState, useEffect, useRef } from 'react';
import type { ChatPhase } from '../../types/chat';

interface VisualStep {
  label: string;
  description: string;
}

const STEPS: VisualStep[] = [
  { label: 'Uploading image', description: 'Sending screenshot to PhenoML' },
  { label: 'Reading clinical content', description: 'Scanning for medical text and values' },
  { label: 'Extracting FHIR resources', description: 'Identifying conditions, medications, and observations' },
  { label: 'Building resource bundle', description: 'Structuring data into FHIR R4 format' },
  { label: 'Preparing agent session', description: 'Connecting to the selected PhenoAgent' },
];

// Auto-advance intervals in ms for each step
const STEP_DELAYS = [1500, 3000, 4000, 3000];

interface Props {
  phase: ChatPhase;
}

export function ChatLoadingState({ phase }: Props) {
  const [visualStep, setVisualStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance visual steps on timers
  useEffect(() => {
    if (visualStep >= STEPS.length - 1) return;
    const delay = STEP_DELAYS[visualStep] ?? 3000;
    const timer = setTimeout(() => {
      setVisualStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [visualStep]);

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 animate-in fade-in duration-300">
      {/* Progress bar */}
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-pheno-bg-secondary">
        <div className="h-full animate-progress rounded-full bg-pheno-accent" />
      </div>

      {/* Vertical stepper */}
      <div className="flex w-full max-w-xs flex-col gap-0">
        {STEPS.map((step, i) => {
          const isComplete = i < visualStep;
          const isActive = i === visualStep;

          return (
            <div key={i} className="flex gap-3">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                {/* Step icon */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                    isComplete
                      ? 'bg-pheno-accent text-white'
                      : isActive
                        ? 'border-2 border-pheno-accent bg-pheno-accent-light text-pheno-accent animate-pulse-glow'
                        : 'border border-pheno-border bg-pheno-bg-secondary text-pheno-text-tertiary'
                  }`}
                >
                  {isComplete ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-px flex-1 min-h-4 transition-colors duration-300 ${
                      isComplete ? 'bg-pheno-accent' : 'bg-pheno-border'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-5 ${isActive ? 'animate-fade-slide-in' : ''}`}>
                <p
                  className={`font-body text-sm font-medium transition-colors duration-300 ${
                    isActive
                      ? 'text-pheno-text-primary'
                      : isComplete
                        ? 'text-pheno-accent'
                        : 'text-pheno-text-tertiary'
                  }`}
                >
                  {step.label}
                  {isActive && (
                    <span className="ml-0.5 inline-block animate-pulse">...</span>
                  )}
                </p>
                {(isActive || isComplete) && (
                  <p className="mt-0.5 font-body text-xs text-pheno-text-tertiary">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Elapsed timer */}
      <p className="font-mono text-xs text-pheno-text-tertiary">
        {elapsed}s elapsed
      </p>
    </div>
  );
}
