import { useCds } from '../../context/CdsContext';
import { useCdsPipeline } from '../../hooks/useCdsPipeline';
import { AgentPicker } from '../chat/AgentPicker';
import { ChatMessages } from '../chat/ChatMessages';
import { ChatInput } from '../chat/ChatInput';
import { PhenoChartLogo } from '../PhenoChartLogo';

interface Props {
  onOpenSettings: () => void;
  agentRefreshKey?: number;
}

export function CdsView({ onOpenSettings, agentRefreshKey }: Props) {
  const { messages, isStreaming, selectedAgent, error, dispatch } = useCds();
  const { sendMessage, newConversation } = useCdsPipeline();

  // Empty state — no messages yet (with agent picker)
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col animate-in fade-in duration-300">
        {/* Settings gear */}
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="text-pheno-text-tertiary transition-colors hover:text-pheno-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <PhenoChartLogo size="lg" />
          <p className="max-w-52 text-center font-body text-sm text-pheno-text-secondary">
            Ask the agent about this patient to prepare for their upcoming appointment.
          </p>
          <div className="w-full max-w-xs">
            <AgentPicker
              selectedAgent={selectedAgent}
              onSelect={(agent) => dispatch({ type: 'SELECT_AGENT', agent })}
              disabled={false}
              refreshKey={agentRefreshKey}
            />
          </div>
        </div>

        <ChatInput onSend={sendMessage} disabled={!selectedAgent} />
      </div>
    );
  }

  // Chat state — messages + input
  return (
    <div className="flex flex-1 flex-col bg-pheno-bg">
      {/* Header with agent name and new conversation button */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pheno-border bg-pheno-bg px-3 py-2">
        <span className="font-body text-xs font-medium text-pheno-text-secondary">
          {selectedAgent?.name ?? 'Appointment Prep'}
        </span>
        <button
          onClick={newConversation}
          disabled={isStreaming}
          className="font-body text-xs text-pheno-text-tertiary transition-colors hover:text-pheno-text-secondary disabled:opacity-40"
        >
          New Conversation
        </button>
      </div>

      <ChatMessages messages={messages} />

      {error && (
        <div className="border-t border-pheno-reject/20 bg-pheno-reject/5 px-4 py-2">
          <p className="font-body text-xs text-pheno-reject">{error}</p>
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="font-body text-xs text-pheno-text-secondary underline"
            >
              Retry
            </button>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="font-body text-xs text-pheno-text-tertiary underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
