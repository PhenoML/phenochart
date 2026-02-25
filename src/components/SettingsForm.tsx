import { useState, useEffect } from 'react';
import { getConfig, saveConfig, DEFAULT_CODE_SYSTEMS } from '../lib/config';
import type { CodeSystem } from '../types';
import { Divider } from './Divider';

const ALL_CODE_SYSTEMS: Array<{ value: CodeSystem; label: string }> = [
  { value: 'ICD-10-CM',         label: 'ICD-10-CM (2025)' },
  { value: 'ICD-10-PCS',        label: 'ICD-10-PCS (2025)' },
  { value: 'RXNORM',            label: 'RxNorm (11042024)' },
  { value: 'LOINC',             label: 'LOINC (2.78)' },
  { value: 'HPO',               label: 'HPO (2025)' },
  { value: 'CPT',               label: 'CPT (2025)' },
  { value: 'SNOMED_CT_US_LITE', label: 'SNOMED CT US Lite (20240901)' },
];

interface Props {
  onClose?: () => void;
}

export function SettingsForm({ onClose }: Props) {
  const [instanceUrl, setInstanceUrl] = useState('https://experiment.app.pheno.ml');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [fhirProviderId, setFhirProviderId] = useState('');
  const [codeSystems, setCodeSystems] = useState<CodeSystem[]>(DEFAULT_CODE_SYSTEMS);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    getConfig().then((config) => {
      if (config) {
        setInstanceUrl(config.instanceUrl);
        setClientId(config.clientId);
        setClientSecret(config.clientSecret);
        setFhirProviderId(config.fhirProviderId);
        setCodeSystems(config.codeSystems);
      }
    });
  }, []);

  function toggleCodeSystem(system: CodeSystem) {
    setCodeSystems((prev) =>
      prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveConfig({ instanceUrl, clientId, clientSecret, fhirProviderId, codeSystems });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }

  const canSave =
    instanceUrl.trim() &&
    clientId.trim() &&
    clientSecret.trim() &&
    fhirProviderId.trim() &&
    codeSystems.length > 0;

  return (
    <>
      {onClose && (
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-pheno-border bg-pheno-bg px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded text-pheno-text-tertiary transition-colors hover:text-pheno-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="font-body text-sm font-medium text-pheno-text-primary">Settings</span>
        </div>
      )}

      <div className="flex flex-col gap-4 p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Instance URL
            </span>
            <input
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://experiment.app.pheno.ml"
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Client ID
            </span>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Client Secret
            </span>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              FHIR Provider ID
            </span>
            <input
              type="text"
              value={fhirProviderId}
              onChange={(e) => setFhirProviderId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Code Systems
            </span>
            <div className="flex flex-col gap-1.5 rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2.5">
              {ALL_CODE_SYSTEMS.map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={codeSystems.includes(value)}
                    onChange={() => toggleCodeSystem(value)}
                    className="h-3.5 w-3.5 rounded border-pheno-border accent-pheno-accent"
                  />
                  <span className="font-mono text-sm text-pheno-text-primary">{label}</span>
                </label>
              ))}
            </div>
            {codeSystems.length === 0 && (
              <p className="font-body text-xs text-pheno-reject">
                Select at least one code system.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSave}
            className="mt-2 rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            Save Credentials
          </button>

          {status === 'saved' && (
            <p className="font-body text-sm text-pheno-accent">Credentials saved.</p>
          )}
          {status === 'error' && (
            <p className="font-body text-sm text-pheno-reject">Failed to save. Please try again.</p>
          )}
        </form>

        <Divider className="my-2" />

        <p className="font-body text-xs text-pheno-text-tertiary">
          Credentials are stored locally in your browser and only sent to the PhenoML instance you
          configure.
        </p>
      </div>
    </>
  );
}
