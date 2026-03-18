import { useState, useEffect, useRef } from 'react';
import { fetchAgents } from '../../lib/agent';
import type { AgentInfo } from '../../types/chat';

interface Props {
  selectedAgent: AgentInfo | null;
  onSelect: (agent: AgentInfo) => void;
  disabled?: boolean;
  refreshKey?: number;
}

export function AgentPicker({ selectedAgent, onSelect, disabled, refreshKey = 0 }: Props) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAgents()
      .then((list) => {
        setAgents(list);
        if (list.length === 1 && !selectedAgent) {
          onSelectRef.current(list[0]);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load agents.'),
      )
      .finally(() => setLoading(false));
  }, [retryCount, refreshKey, selectedAgent]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const agent = agents.find((a) => a.id === e.target.value);
    if (agent) onSelect(agent);
  }

  if (loading) {
    return (
      <p className="font-body text-xs text-pheno-text-tertiary">
        Loading agents&hellip;
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="font-body text-xs text-pheno-reject">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="self-start font-body text-xs text-pheno-text-secondary underline transition-colors hover:text-pheno-text-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <p className="font-body text-xs text-pheno-text-tertiary">
        No agents available. Create one in your PhenoML instance.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-body text-xs font-medium text-pheno-text-secondary">
        Agent
      </span>
      <select
        value={selectedAgent?.id ?? ''}
        onChange={handleChange}
        disabled={disabled}
        className="rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-body text-sm text-pheno-text-primary focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring disabled:opacity-40"
      >
        <option value="" disabled>
          Select an agent&hellip;
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      {selectedAgent?.description && (
        <p className="font-body text-xs text-pheno-text-tertiary">
          {selectedAgent.description}
        </p>
      )}
    </div>
  );
}
