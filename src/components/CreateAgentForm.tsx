import { useState } from 'react';
import { createAgentWithPrompt } from '../lib/agent';

interface Props {
  onBack: () => void;
  onCreated: (agentId: string) => void;
}

export function CreateAgentForm({ onBack, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const creating = status === 'creating';
  const canSubmit = name.trim() && systemPrompt.trim() && !creating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('creating');
    setErrorMessage('');
    try {
      const result = await createAgentWithPrompt({
        name: name.trim(),
        description: description.trim() || undefined,
        systemPrompt: systemPrompt.trim(),
      });
      onCreated(result.agentId);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to create agent.',
      );
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-pheno-border bg-pheno-bg px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Back to settings"
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
        <span className="font-body text-sm font-medium text-pheno-text-primary">Create Agent</span>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Agent Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              placeholder="e.g. CDS Cardiology"
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring disabled:opacity-40"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              Description
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              placeholder="Optional"
              className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-mono text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring disabled:opacity-40"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-pheno-text-primary">
              System Prompt
            </span>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={creating}
              placeholder="Instructions for the agent..."
              rows={6}
              className="resize-none rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-body text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring disabled:opacity-40"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            {creating ? 'Creating\u2026' : 'Create Agent'}
          </button>

          {status === 'error' && (
            <p className="font-body text-sm text-pheno-reject">{errorMessage}</p>
          )}
        </form>
      </div>
    </>
  );
}
