import { useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { usePageContext } from './usePageContext';
import { captureScreenshot, streamAgentChat } from '../lib/agent';
import { getLlmConfig } from '../lib/config';
import { sendChatCompletion } from '../lib/llm';
import type { BackgroundTask } from '../types/chat';

export function useChatPipeline() {
  const { dispatch, selectedAgent, sessionId, isStreaming, screenshotBase64 } =
    useChat();
  const { patientId, url: pageUrl } = usePageContext();
  const abortRef = useRef<AbortController | null>(null);
  const userPromptRef = useRef('');

  const setUserPrompt = useCallback((prompt: string) => {
    userPromptRef.current = prompt;
  }, []);

  const startPipeline = useCallback(async () => {
    if (!selectedAgent) {
      dispatch({ type: 'SET_ERROR', error: 'Select an agent to continue.' });
      return;
    }

    try {
      // Capture screenshot and show preview
      dispatch({ type: 'START_CAPTURE' });
      const { dataUrl, base64 } = await captureScreenshot();
      dispatch({ type: 'SCREENSHOT_CAPTURED', dataUrl, base64 });
      // Pipeline pauses here — user must confirm or retake
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Pipeline failed.',
      });
    }
  }, [selectedAgent, dispatch]);

  /** Fire and forget: delegate extraction + agent chat to the background worker. */
  const confirmScreenshot = useCallback(async () => {
    if (!selectedAgent || !screenshotBase64) return;

    // Fire and forget — don't await. The background keeps the message
    // channel open for the full pipeline, but we don't need the response.
    browser.runtime.sendMessage({
      type: 'START_PIPELINE',
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      userPrompt:
        userPromptRef.current ||
        'What can you help with based on this chart?',
      screenshotBase64,
      screenshotDataUrl: `data:image/png;base64,${screenshotBase64}`,
      patientId: patientId ?? undefined,
      sourceUrl: pageUrl,
    }).catch(() => {
      // Background may be restarting; task will still appear via storage
    });

    // Return to idle immediately
    dispatch({ type: 'RESET' });
  }, [selectedAgent, screenshotBase64, patientId, pageUrl, dispatch]);

  const retakeScreenshot = useCallback(() => {
    dispatch({ type: 'RETAKE' });
  }, [dispatch]);

  /** Load a completed background task into the chat view for follow-ups. */
  const viewTask = useCallback(
    (task: BackgroundTask) => {
      dispatch({
        type: 'LOAD_TASK',
        messages: task.messages,
        sessionId: task.sessionId,
        agentId: task.agentId,
        agentName: task.agentName,
      });
    },
    [dispatch],
  );

  // --- Follow-up streaming (runs directly in the panel) ---

  async function sendMessageInternal(
    content: string,
    agentId: string,
    currentSessionId: string | null,
  ) {
    const userMsgId = `msg-${crypto.randomUUID()}`;
    dispatch({ type: 'ADD_USER_MESSAGE', id: userMsgId, content });

    const assistantMsgId = `msg-${crypto.randomUUID()}`;
    dispatch({ type: 'START_STREAM', messageId: assistantMsgId });

    abortRef.current = new AbortController();

    try {
      const stream = streamAgentChat({
        agentId,
        message: content,
        sessionId: currentSessionId ?? undefined,
        patientId: patientId ?? undefined,
        signal: abortRef.current.signal,
      });

      for await (const event of stream) {
        if (abortRef.current.signal.aborted) break;

        switch (event.type) {
          case 'message_start':
            if (event.sessionId) {
              dispatch({
                type: 'SET_SESSION_ID',
                sessionId: event.sessionId,
              });
            }
            break;
          case 'content_delta':
            if (event.content) {
              dispatch({
                type: 'STREAM_DELTA',
                messageId: assistantMsgId,
                delta: event.content,
              });
            }
            break;
          case 'error':
            dispatch({
              type: 'SET_ERROR',
              error: event.content ?? 'Stream error.',
            });
            return;
        }
      }

      dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
    } catch (err) {
      if (!abortRef.current.signal.aborted) {
        dispatch({
          type: 'SET_ERROR',
          error: err instanceof Error ? err.message : 'Chat failed.',
        });
      }
    }
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedAgent || isStreaming) return;
      await sendMessageInternal(content, selectedAgent.id, sessionId);
    },
    [selectedAgent, sessionId, isStreaming],
  );

  const sendToLlm = useCallback(
    async (assistantMessageContent: string) => {
      const llmConfig = await getLlmConfig();
      if (!llmConfig) {
        dispatch({ type: 'SET_ERROR', error: 'LLM API not configured.' });
        return;
      }

      try {
        const content = await sendChatCompletion({
          baseUrl: llmConfig.apiUrl,
          apiKey: llmConfig.apiKey,
          apiKeyHeader: llmConfig.apiKeyHeader,
          model: llmConfig.model,
          messages: [{ role: 'user', content: assistantMessageContent }],
        });
        dispatch({
          type: 'ADD_ASSISTANT_MESSAGE',
          id: `msg-${crypto.randomUUID()}`,
          content,
          source: 'llm',
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          error: err instanceof Error ? err.message : 'LLM request failed.',
        });
      }
    },
    [dispatch],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    startPipeline,
    confirmScreenshot,
    retakeScreenshot,
    sendMessage,
    cancelStream,
    sendToLlm,
    viewTask,
    setUserPrompt,
  };
}
