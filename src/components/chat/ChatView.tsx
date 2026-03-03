import { useChat } from '../../context/ChatContext';
import { useChatPipeline } from '../../hooks/useChatPipeline';
import { PhenoChartLogo } from '../PhenoChartLogo';
import { Divider } from '../Divider';
import { AgentPicker } from './AgentPicker';
import { ChatLoadingState } from './ChatLoadingState';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { SuggestedActions } from './SuggestedActions';

interface Props {
  onOpenSettings: () => void;
}

export function ChatView({ onOpenSettings }: Props) {
  const { phase, selectedAgent, isStreaming, messages, error, screenshotDataUrl, dispatch } = useChat();
  const { startPipeline, confirmScreenshot, retakeScreenshot, sendMessage, cancelStream } = useChatPipeline();

  // Idle state — agent picker + capture button
  if (phase === 'idle') {
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

        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <PhenoChartLogo size="lg" />
          <p className="text-center font-body text-sm text-pheno-text-secondary">
            Capture the visible page and chat with a PhenoAgent about the clinical content.
          </p>

          <div className="w-full">
            <AgentPicker />
          </div>

          <button
            onClick={startPipeline}
            disabled={!selectedAgent}
            className="w-full rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            Capture &amp; Chat
          </button>

          <Divider className="w-full" />
          <p className="font-body text-xs text-pheno-text-tertiary">
            Powered by PhenoML Agent API
          </p>
        </div>
      </div>
    );
  }

  // Preview state — confirm or retake screenshot
  if (phase === 'preview' && screenshotDataUrl) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-4 bg-pheno-bg">
        <img
          src={screenshotDataUrl}
          alt="Screenshot preview"
          className="w-full rounded-md border border-pheno-border"
        />
        <div className="flex gap-2">
          <button
            onClick={retakeScreenshot}
            className="flex-1 rounded-md border border-pheno-border px-4 py-2 font-body text-sm text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary"
          >
            Retake
          </button>
          <button
            onClick={confirmScreenshot}
            className="flex-1 rounded-md bg-pheno-accent px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90"
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  // Loading state — pipeline in progress
  if (phase === 'capturing' || phase === 'extracting_fhir' || phase === 'summarizing') {
    return (
      <div className="min-h-screen bg-pheno-bg">
        <ChatLoadingState phase={phase} />
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="font-body text-sm text-pheno-text-primary">
          {error ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="rounded-md border border-pheno-border px-4 py-2 font-body text-sm text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Chat state — messages + input
  const showSuggestions = messages.length === 2 && !isStreaming;

  return (
    <div className="flex min-h-screen flex-col bg-pheno-bg">
      <ChatMessages />
      {showSuggestions && (
        <SuggestedActions onSelect={sendMessage} disabled={isStreaming} />
      )}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
