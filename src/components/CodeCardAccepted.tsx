import { PillBadge } from './PillBadge';
import type { ExtractedCode } from '../types';

interface CodeCardAcceptedProps {
  code: ExtractedCode;
}

export function CodeCardAccepted({ code }: CodeCardAcceptedProps) {
  return (
    <div className="border-b border-pheno-border border-l-[3px] border-l-pheno-accent bg-pheno-bg-panel px-4 py-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-pheno-text-tertiary">
            {code.code}
          </span>
          <p className="font-body text-sm font-semibold text-pheno-text-primary">
            {code.description}
          </p>
        </div>
        <PillBadge variant="accepted" />
      </div>
    </div>
  );
}
