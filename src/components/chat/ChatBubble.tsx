import { useState, useCallback } from 'react';
import type { ChatMessage } from '../../types/chat';

interface Props {
  message: ChatMessage;
}

function countEntries(json: string): number {
  try {
    return JSON.parse(json).entry?.length ?? 0;
  } catch {
    return 0;
  }
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-pheno-accent-light text-pheno-text-primary'
            : 'border-l-2 border-pheno-accent bg-pheno-bg-panel text-pheno-text-primary shadow-sm'
        }`}
      >
        {message.fhirJson && (
          <details className="mb-2">
            <summary className="cursor-pointer font-body text-xs text-pheno-text-tertiary hover:text-pheno-text-secondary">
              FHIR Bundle ({countEntries(message.fhirJson)} resources)
            </summary>
            <pre className="mt-1 max-h-64 overflow-auto rounded bg-pheno-bg-base p-2 font-mono text-[11px] leading-tight text-pheno-text-secondary">
              {message.fhirJson}
            </pre>
          </details>
        )}
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed">
          {message.content}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-pheno-accent" />
          )}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="font-mono text-[10px] text-pheno-text-tertiary">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {isAssistant && !message.isStreaming && (
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="font-body text-[10px] text-pheno-text-tertiary hover:text-pheno-accent transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
