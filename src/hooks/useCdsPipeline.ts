import { useRef, useCallback, useEffect } from 'react';
import { useCds } from '../context/CdsContext';
import { usePageContext } from './usePageContext';
import { getConfig } from '../lib/config';
import { fetchAgents, streamAgentChat } from '../lib/agent';
import { clearCdsSession } from '../lib/cdsSession';
import { buildCdsMessage, buildAgentContext } from '../lib/cdsMessage';

export function useCdsPipeline() {
  const { messages, isStreaming, sessionId, selectedAgent, dispatch } = useCds();
  const { patientId } = usePageContext();
  const abortRef = useRef<AbortController | null>(null);
  const customPromptRef = useRef<string | null>(null);
  const effectivePatientId = patientId ?? 'demo';

  // Load default CDS agent and custom prompt from config on mount
  useEffect(() => {
    getConfig().then(async (config) => {
      if (config?.cdsAgentPrompt) {
        customPromptRef.current = config.cdsAgentPrompt;
      }
      if (config?.cdsAgentId) {
        try {
          const agents = await fetchAgents();
          const match = agents.find((a) => a.id === config.cdsAgentId);
          if (match) {
            dispatch({ type: 'SELECT_AGENT', agent: match });
          }
        } catch {
          // Agent list fetch failed — user can still pick manually
        }
      }
    });
  }, [dispatch]);

  const sendMessage = useCallback(
    async (text: string) => {
      const agentId = selectedAgent?.id;
      if (isStreaming || !agentId) {
        if (!agentId) {
          dispatch({
            type: 'SET_ERROR',
            error: 'Select an agent to start chatting.',
          });
        }
        return;
      }

      const isFirstMessage = messages.length === 0;
      const messageContent = buildCdsMessage({
        text,
        isFirstMessage,
        patientId: patientId ?? undefined,
        customPrompt: customPromptRef.current ?? undefined,
      });

      const agentContext = isFirstMessage
        ? buildAgentContext(effectivePatientId, customPromptRef.current ?? undefined)
        : undefined;

      const userMsgId = `cds-user-${crypto.randomUUID()}`;
      dispatch({
        type: 'ADD_USER_MESSAGE',
        id: userMsgId,
        content: text,
        ...(agentContext ? { agentContext } : {}),
      });

      const assistantMsgId = `cds-assistant-${crypto.randomUUID()}`;
      dispatch({ type: 'START_STREAM', messageId: assistantMsgId });

      abortRef.current = new AbortController();

      try {
        const stream = streamAgentChat({
          agentId,
          message: messageContent,
          sessionId: sessionId ?? undefined,
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
              dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
              dispatch({
                type: 'SET_ERROR',
                error: event.content ?? 'Stream error.',
              });
              return;
          }
        }

        dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
      } catch (err) {
        dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
        if (!abortRef.current.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Chat failed.';

          if (/session.*not found/i.test(message)) {
            dispatch({ type: 'SET_SESSION_ID', sessionId: null });
            await clearCdsSession(effectivePatientId);
          }

          dispatch({ type: 'SET_ERROR', error: message });
        }
      }
    },
    [selectedAgent, messages.length, sessionId, isStreaming, patientId, dispatch, effectivePatientId],
  );

  const newConversation = useCallback(async () => {
    abortRef.current?.abort();
    await clearCdsSession(effectivePatientId);
    dispatch({ type: 'NEW_CONVERSATION' });
  }, [effectivePatientId, dispatch]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, newConversation, cancelStream };
}
