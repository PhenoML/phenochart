import { useCallback } from 'react';
import { ChatBubble } from '../chat/ChatBubble';
import { AgentTrace } from './AgentTrace';
import { useCds } from '../../context/CdsContext';
import { fetchSessionTraces } from '../../lib/agent';
import type { ChatMessage, TraceData } from '../../types/chat';

interface Props {
  message: ChatMessage;
}

export function CdsChatBubble({ message }: Props) {
  const { sessionId, messages, dispatch } = useCds();
  const isAssistant = message.role === 'assistant';

  const handleRequestTrace = useCallback(async () => {
    if (!sessionId) return;

    const { tracesByOrder } = await fetchSessionTraces(sessionId);

    const assistantMsgs = messages.filter((m) => m.role === 'assistant');
    const orderKeys = Array.from(tracesByOrder.keys()).sort((a, b) => a - b);

    const traces = new Map<string, TraceData>();
    for (let i = 0; i < assistantMsgs.length && i < orderKeys.length; i++) {
      const toolCalls = tracesByOrder.get(orderKeys[i]) ?? [];
      traces.set(assistantMsgs[i].id, { toolCalls });
    }

    dispatch({ type: 'SET_TRACES', traces });
  }, [sessionId, messages, dispatch]);

  return (
    <>
      <ChatBubble message={message} />
      {isAssistant && !message.isStreaming && sessionId && (
        <AgentTrace trace={message.trace} onRequestTrace={handleRequestTrace} />
      )}
    </>
  );
}
