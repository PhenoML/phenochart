import { useState, useCallback } from 'react';
import type { TraceData } from '../../types/chat';

interface Props {
  trace?: TraceData;
  onRequestTrace: () => Promise<void>;
}

export function AgentTrace({ trace, onRequestTrace }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = (e.currentTarget as HTMLDetailsElement).open;
      if (!isOpen || trace) return;

      setLoading(true);
      setError(null);
      try {
        await onRequestTrace();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trace.');
      } finally {
        setLoading(false);
      }
    },
    [trace, onRequestTrace],
  );

  return (
    <details className="mb-2" onToggle={handleToggle}>
      <summary className="cursor-pointer font-body text-xs text-pheno-text-tertiary hover:text-pheno-text-secondary">
        Agent Trace
        {trace && ` (${trace.toolCalls.length} tool calls)`}
      </summary>
      <div className="mt-1 max-h-64 overflow-auto rounded bg-pheno-bg-base p-2 font-mono text-[11px] leading-tight text-pheno-text-secondary">
        {loading && <p className="text-pheno-text-tertiary">Loading trace...</p>}
        {error && <p className="text-pheno-reject">{error}</p>}
        {trace?.toolCalls.map((call, i) => (
          <details key={i} className="mb-1">
            <summary className="cursor-pointer hover:text-pheno-text-primary">
              {call.name}
            </summary>
            <div className="ml-2 mt-1 space-y-1">
              <div>
                <span className="text-pheno-text-tertiary">args: </span>
                <pre className="inline whitespace-pre-wrap">
                  {JSON.stringify(call.args, null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-pheno-text-tertiary">result: </span>
                <pre className="inline whitespace-pre-wrap">
                  {JSON.stringify(call.result, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        ))}
        {trace && trace.toolCalls.length === 0 && (
          <p className="text-pheno-text-tertiary">No tool calls for this message.</p>
        )}
      </div>
    </details>
  );
}
