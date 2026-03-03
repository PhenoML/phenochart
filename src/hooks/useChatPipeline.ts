import { useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { usePageContext } from './usePageContext';
import {
  captureScreenshot,
  extractFhirResources,
  createSummary,
  streamAgentChat,
} from '../lib/agent';

export function useChatPipeline() {
  const { dispatch, selectedAgent, sessionId, isStreaming } = useChat();
  const { patientId } = usePageContext();
  const abortRef = useRef<AbortController | null>(null);

  const startPipeline = useCallback(async () => {
    if (!selectedAgent) {
      dispatch({ type: 'SET_ERROR', error: 'Select an agent to continue.' });
      return;
    }

    try {
      // Step 1: Capture screenshot
      dispatch({ type: 'START_CAPTURE' });
      const base64 = await captureScreenshot();
      dispatch({ type: 'SCREENSHOT_CAPTURED', base64 });

      // Step 2: Parallel FHIR extraction
      const bundle = await extractFhirResources(base64);
      dispatch({ type: 'FHIR_EXTRACTED', bundle });

      // Step 3: Generate IPS summary
      const summary = await createSummary(bundle);
      dispatch({ type: 'SUMMARY_CREATED', summary });

      // Step 4: Auto-send the summary as the first message to the agent
      const firstMessage = `Here is the clinical summary extracted from the patient's chart:\n\n${summary}\n\nWhat would you like to help with?`;
      await sendMessageInternal(firstMessage, selectedAgent.id, null);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Pipeline failed.',
      });
    }
  }, [selectedAgent, dispatch]);

  async function sendMessageInternal(
    content: string,
    agentId: string,
    currentSessionId: string | null,
  ) {
    const userMsgId = `msg-${Date.now()}`;
    dispatch({ type: 'ADD_USER_MESSAGE', id: userMsgId, content });

    const assistantMsgId = `msg-${Date.now()}-assistant`;
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
              dispatch({ type: 'SET_SESSION_ID', sessionId: event.sessionId });
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

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startPipeline, sendMessage, cancelStream };
}
