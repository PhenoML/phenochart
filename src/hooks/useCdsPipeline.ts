import { useRef, useCallback, useEffect } from 'react';
import { useCds } from '../context/CdsContext';
import { usePageContext } from './usePageContext';
import { getConfig } from '../lib/config';
import { fetchAgents, streamAgentChat } from '../lib/agent';
import { clearCdsSession } from '../lib/cdsSession';
import { buildCdsMessage, buildAgentContext } from '../lib/cdsMessage';
import { CDS_AUTO_SUMMARY_PROMPT } from '../lib/cdsPrompt';
import type { CdsAction } from './useCdsState';

interface ProcessStreamOptions {
  agentId: string;
  message: string;
  assistantMsgId: string;
  sessionId: string | null;
  patientId: string | undefined;
  controller: AbortController;
  dispatch: React.Dispatch<CdsAction>;
  effectivePatientId: string;
}

async function processStream(options: ProcessStreamOptions): Promise<void> {
  const { agentId, message, assistantMsgId, sessionId, patientId, controller, dispatch, effectivePatientId } = options;

  try {
    const stream = streamAgentChat({
      agentId,
      message,
      sessionId: sessionId ?? undefined,
      patientId,
      signal: controller.signal,
    });

    for await (const event of stream) {
      if (controller.signal.aborted) break;
      switch (event.type) {
        case 'message_start':
          if (event.sessionId) {
            dispatch({ type: 'SET_SESSION_ID', sessionId: event.sessionId });
          }
          break;
        case 'content_delta':
          if (event.content) {
            dispatch({ type: 'STREAM_DELTA', messageId: assistantMsgId, delta: event.content });
          }
          break;
        case 'error':
          dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
          dispatch({ type: 'SET_ERROR', error: event.content ?? 'Stream error.' });
          return;
      }
    }
    dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
  } catch (err) {
    dispatch({ type: 'STREAM_END', messageId: assistantMsgId });
    if (!controller.signal.aborted) {
      const errorMessage = err instanceof Error ? err.message : 'Chat failed.';
      if (/session.*not found/i.test(errorMessage)) {
        dispatch({ type: 'SET_SESSION_ID', sessionId: null });
        clearCdsSession(effectivePatientId);
      }
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  }
}

export function useCdsPipeline() {
  const { messages, isStreaming, sessionId, selectedAgent, phase, dispatch } = useCds();
  const { patientId } = usePageContext();
  const abortRef = useRef<AbortController | null>(null);
  const autoSummaryFiredRef = useRef(false);
  const effectivePatientId = patientId ?? 'demo';

  // Load default CDS agent from config on mount
  useEffect(() => {
    getConfig().then(async (config) => {
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

  // Auto-trigger appointment summary when agent is selected and CDS is visible
  useEffect(() => {
    if (
      selectedAgent &&
      patientId &&
      messages.length === 0 &&
      phase === 'idle' &&
      !autoSummaryFiredRef.current
    ) {
      autoSummaryFiredRef.current = true;
      dispatch({ type: 'AUTO_SUMMARY_START' });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const agentId = selectedAgent.id;
        const messageContent = buildCdsMessage({
          text: CDS_AUTO_SUMMARY_PROMPT,
          patientId,
          isFirstMessage: true,
        });
        const agentContext = buildAgentContext(patientId);

        const userMsgId = `cds-user-${crypto.randomUUID()}`;
        dispatch({
          type: 'ADD_USER_MESSAGE',
          id: userMsgId,
          content: CDS_AUTO_SUMMARY_PROMPT,
          agentContext,
        });

        const assistantMsgId = `cds-assistant-${crypto.randomUUID()}`;
        dispatch({ type: 'START_STREAM', messageId: assistantMsgId });

        processStream({
          agentId,
          message: messageContent,
          assistantMsgId,
          // sessionId is always null here (initial state, gated by phase === 'idle')
          sessionId,
          patientId,
          controller,
          dispatch,
          effectivePatientId,
        }).catch(() => {
          // Errors are already dispatched inside processStream via SET_ERROR.
          // This catch prevents unhandled promise rejections if processStream
          // throws before its internal try/catch (defensive).
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Auto-summary failed.';
        dispatch({ type: 'SET_ERROR', error: message });
      }

      return () => { controller.abort(); };
    }
    // sessionId intentionally excluded — always null when effect fires (gated by phase === 'idle' && messages.length === 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, patientId, messages.length, phase, dispatch]);

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
        patientId: patientId ?? undefined,
        isFirstMessage,
      });

      const agentContext = isFirstMessage
        ? buildAgentContext(effectivePatientId)
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

      const controller = new AbortController();
      abortRef.current = controller;

      await processStream({
        agentId,
        message: messageContent,
        assistantMsgId,
        sessionId,
        patientId: patientId ?? undefined,
        controller,
        dispatch,
        effectivePatientId,
      });
    },
    [selectedAgent, messages.length, sessionId, isStreaming, patientId, dispatch, effectivePatientId],
  );

  const newConversation = useCallback(async () => {
    abortRef.current?.abort();
    autoSummaryFiredRef.current = false;
    await clearCdsSession(effectivePatientId);
    dispatch({ type: 'NEW_CONVERSATION' });
  }, [effectivePatientId, dispatch]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, newConversation, cancelStream };
}
