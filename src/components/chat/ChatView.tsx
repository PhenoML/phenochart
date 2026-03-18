import { useState, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useChatPipeline } from '../../hooks/useChatPipeline';
import { useBackgroundTasks } from '../../hooks/useBackgroundTasks';
import { PhenoChartLogo } from '../PhenoChartLogo';
import { Divider } from '../Divider';
import { Toast } from '../Toast';
import { AgentPicker } from './AgentPicker';
import { TaskTray } from './TaskTray';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { SuggestedActions } from './SuggestedActions';

interface Props {
  onOpenSettings: () => void;
}

export function ChatView({ onOpenSettings }: Props) {
  const { phase, selectedAgent, isStreaming, messages, error, screenshotDataUrl, dispatch } = useChat();
  const { startPipeline, confirmScreenshot, retakeScreenshot, sendMessage, viewTask, setUserPrompt } = useChatPipeline();
  const { tasks, dismissTask, openTask } = useBackgroundTasks();

  const [userPrompt, setUserPromptLocal] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePromptChange = useCallback(
    (value: string) => {
      setUserPromptLocal(value);
      setUserPrompt(value);
    },
    [setUserPrompt],
  );

  const handleConfirmScreenshot = useCallback(async () => {
    await confirmScreenshot();
    setToastMessage('Context captured. Processing in the background...');
    setUserPromptLocal('');
  }, [confirmScreenshot]);

  const handleViewTask = useCallback(
    (taskId: string) => {
      const task = openTask(taskId);
      if (task) viewTask(task);
    },
    [openTask, viewTask],
  );

  // Idle state — agent picker + prompt input + capture button + task tray
  if (phase === 'idle') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        {toastMessage && (
          <Toast
            message={toastMessage}
            onDone={() => setToastMessage(null)}
          />
        )}

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
            Capture the visible page and send it to a PhenoAgent for processing in the background.
          </p>

          <div className="w-full">
            <AgentPicker
              selectedAgent={selectedAgent}
              onSelect={(agent) => dispatch({ type: 'SELECT_AGENT', agent })}
            />
          </div>

          {selectedAgent && (
            <textarea
              value={userPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Instructions for the agent, e.g. 'Draft prior auth rationale' or 'Summarize key findings'..."
              rows={2}
              className="w-full resize-none rounded-md border border-pheno-border bg-pheno-bg-panel px-3 py-2 font-body text-sm text-pheno-text-primary placeholder:text-pheno-text-tertiary focus:border-pheno-accent focus:outline-none focus:ring-2 focus:ring-pheno-focus-ring"
            />
          )}

          <button
            onClick={startPipeline}
            disabled={!selectedAgent}
            className="w-full rounded-md bg-pheno-accent px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pheno-focus-ring"
          >
            Capture &amp; Send
          </button>

          {tasks.length > 0 && (
            <>
              <Divider className="w-full" />
              <TaskTray
                tasks={tasks}
                onViewTask={handleViewTask}
                onDismissTask={dismissTask}
              />
            </>
          )}

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
      <div className="flex min-h-screen flex-col gap-4 p-4 bg-pheno-bg animate-in fade-in duration-300">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg text-pheno-text-primary">Review Screenshot</h2>
          <p className="font-body text-xs text-pheno-text-tertiary">
            Make sure the clinical content is visible before sending.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-pheno-border shadow-sm animate-fade-slide-in">
          <img
            src={screenshotDataUrl}
            alt="Screenshot preview"
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={retakeScreenshot}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-pheno-border px-4 py-2.5 font-body text-sm text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            Retake
          </button>
          <button
            onClick={handleConfirmScreenshot}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-pheno-accent px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-pheno-accent/90"
          >
            Send
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Capturing state — brief loading while screenshot is taken
  if (phase === 'capturing') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-body text-sm text-pheno-text-secondary animate-pulse">
          Capturing...
        </p>
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

  // Chat state — messages + input (viewing a completed task or follow-ups)
  const showSuggestions = messages.length === 2 && !isStreaming;

  return (
    <div className="flex min-h-screen flex-col bg-pheno-bg">
      {/* Back button */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-pheno-border bg-pheno-bg px-3 py-2">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="flex items-center gap-1 font-body text-xs text-pheno-text-secondary hover:text-pheno-text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>

      <ChatMessages messages={messages} />
      {showSuggestions && (
        <SuggestedActions onSelect={sendMessage} disabled={isStreaming} />
      )}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
