import { useState, useEffect } from 'react';
import { getConfig } from '../lib/config';
import type { CodeSystem } from '../types';

export function LoadingState() {
  const [codeSystems, setCodeSystems] = useState<CodeSystem[]>([]);

  useEffect(() => {
    getConfig().then((config) => {
      if (config?.codeSystems?.length) {
        setCodeSystems(config.codeSystems);
      }
    });
  }, []);

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
        {codeSystems.length > 0 && (
          <p className="font-mono text-xs text-pheno-text-tertiary">
            {codeSystems.join(' \u00b7 ')}
          </p>
        )}
      </div>
    </div>
  );
}
