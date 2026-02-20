import { useState } from 'react';
import { useApp } from '../context/AppContext';

const COLLAPSED_LINES = 4;

export function EncounterNarrative() {
  const { encounter } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!encounter) return null;

  return (
    <div className="border-b border-pheno-border bg-pheno-bg-panel px-4 py-3 animate-in fade-in duration-200">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-pheno-text-tertiary">
          Encounter Narrative
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse encounter narrative' : 'Expand encounter narrative'}
          className="font-body text-xs text-pheno-accent hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
      <div
        className={`overflow-hidden font-body text-xs leading-relaxed text-pheno-text-secondary transition-all duration-200 ${
          isExpanded ? 'max-h-[2000px]' : 'max-h-[5.6em]'
        }`}
      >
        <p className="whitespace-pre-wrap">{encounter.narrative}</p>
      </div>
    </div>
  );
}
