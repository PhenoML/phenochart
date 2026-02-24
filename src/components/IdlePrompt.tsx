import { useState, useEffect } from 'react';
import { PhenoChartLogo } from './PhenoChartLogo';
import { Divider } from './Divider';
import { useApp } from '../context/AppContext';
import { usePageContext } from '../hooks/usePageContext';
import { fetchEncounter, extractCodes } from '../mock/services';
import { getConfig } from '../lib/config';

export function IdlePrompt() {
  const { dispatch } = useApp();
  const { isMedPlum, isEncounterPage } = usePageContext();
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

  async function handleLoadDemo() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const encounter = await fetchEncounter();
      dispatch({ type: 'LOAD_ENCOUNTER', encounter });
      const codes = await extractCodes(encounter.narrative);
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

  function handleOpenSettings() {
    browser.runtime.openOptionsPage();
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
            onClick={handleOpenSettings}
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
  const message = isMedPlum
    ? isEncounterPage
      ? 'Extract codes from this encounter.'
      : 'Navigate to a patient encounter to begin code extraction.'
    : 'Open a patient encounter in MedPlum to begin code extraction.';

  const buttonLabel = isMedPlum && isEncounterPage
    ? 'Extract Codes'
    : 'Load Demo Encounter';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6">
        <PhenoChartLogo size="lg" />
        <p className="max-w-60 text-center font-body text-sm text-pheno-text-secondary">
          {message}
        </p>
        <button
          onClick={handleLoadDemo}
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
