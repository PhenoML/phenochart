import { useState, useEffect } from 'react';
import { getConfig, saveConfig, type PhenoConfig } from '../../lib/config';
import { PhenoChartLogo } from '../../components/PhenoChartLogo';
import { Divider } from '../../components/Divider';

export default function App() {
  const [instanceUrl, setInstanceUrl] = useState('https://experiment.app.pheno.ml');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    getConfig().then((config) => {
      if (config) {
        setInstanceUrl(config.instanceUrl);
        setClientId(config.clientId);
        setClientSecret(config.clientSecret);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveConfig({ instanceUrl, clientId, clientSecret });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }

  const canSave = instanceUrl.trim() && clientId.trim() && clientSecret.trim();

  return (
    <div className="min-h-screen bg-pheno-bg p-8">
      <div className="mx-auto max-w-md">
        <PhenoChartLogo size="md" className="mb-6" />
        <Divider className="mb-6" />

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

        <Divider className="my-6" />

        <p className="font-body text-xs text-pheno-text-tertiary">
          Credentials are stored locally in your browser and only sent to the PhenoML instance you configure.
        </p>
      </div>
    </div>
  );
}
