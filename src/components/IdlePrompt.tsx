import { useState, useEffect } from 'react';
import { PhenoChartLogo } from './PhenoChartLogo';
import { Divider } from './Divider';
import { useApp } from '../context/AppContext';
import { usePageContext } from '../hooks/usePageContext';
import { fetchEncounter, extractCodes } from '../mock/services';
import { getConfig } from '../lib/config';
import { fetchRealEncounter } from '../lib/fhir';

interface Props {
  onOpenSettings: () => void;
}

export function IdlePrompt({ onOpenSettings }: Props) {
  const { dispatch } = useApp();
  const { isMedPlum, isEncounterPage, patientId, encounterId } = usePageContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    getConfig().then((config) => setIsConfigured(config !== null));

    function handleStorageChange(changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) {
      if ('phenoml_config' in changes) {
        getConfig().then((config) => setIsConfigured(config !== null));
      }
    }

    browser.storage.local.onChanged.addListener(handleStorageChange);
    return () => browser.storage.local.onChanged.removeListener(handleStorageChange);
  }, []);

  async function handleExtract() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const encounter =
        isEncounterPage && patientId && encounterId
          ? await fetchRealEncounter(patientId, encounterId)
          : await fetchEncounter();
      dispatch({ type: 'LOAD_ENCOUNTER', encounter });
      const codes = encounter.narrative.trim()
        ? await extractCodes(encounter.narrative)
        : [];
      dispatch({ type: 'CODES_EXTRACTED', codes });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to load encounter',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Still loading config state
  if (isConfigured === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <PhenoChartLogo size="lg" />
      </div>
    );
  }

  // Not configured — prompt to set up
  if (!isConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-6">
          <PhenoChartLogo size="lg" />
          <p className="max-w-60 text-center font-body text-sm text-pheno-text-secondary">
            Connect to PhenoML to start extracting codes from clinical narratives.
          </p>
          <button
            onClick={onOpenSettings}
            className="rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            Set Up Credentials
          </button>
          <Divider className="w-full" />
          <p className="font-body text-xs text-pheno-text-tertiary">
            Powered by PhenoML Construe API
          </p>
        </div>
      </div>
    );
  }

  // Configured — existing UI
  const message = isMedPlum && isEncounterPage
    ? 'Extract codes from this encounter.'
    : 'Navigate to a patient encounter in your MedPlum instance, or try the demo encounter.';

  const buttonLabel = isMedPlum && isEncounterPage ? 'Extract Codes' : 'Try Demo Encounter';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <button
        onClick={onOpenSettings}
        title="Settings"
        className="absolute right-4 top-4 text-pheno-text-tertiary transition-colors hover:text-pheno-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring rounded"
      >
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
      </button>
      <div className="flex flex-col items-center gap-6">
        <PhenoChartLogo size="lg" />
        <p className="max-w-60 text-center font-body text-sm text-pheno-text-secondary">
          {message}
        </p>
        <button
          onClick={handleExtract}
          disabled={isLoading}
          className="rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
        >
          {buttonLabel}
        </button>
        <Divider className="w-full" />
        <p className="font-body text-xs text-pheno-text-tertiary">
          Powered by PhenoML Construe API
        </p>
      </div>
    </div>
  );
}
