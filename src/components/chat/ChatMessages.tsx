import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useChatPipeline } from '../../hooks/useChatPipeline';
import { getLlmConfig } from '../../lib/config';
import { ChatBubble } from './ChatBubble';

export function ChatMessages() {
  const { messages, isStreaming } = useChat();
  const { sendToLlm } = useChatPipeline();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hasLlmConfig, setHasLlmConfig] = useState(false);
  const [loadingMsgId, setLoadingMsgId] = useState<string | null>(null);

  useEffect(() => {
    getLlmConfig().then((config) => {
      setHasLlmConfig(!!config);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleLlmReview(messageId: string, content: string) {
    setLoadingMsgId(messageId);
    await sendToLlm(content);
    setLoadingMsgId(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          showLlmReview={
            hasLlmConfig &&
            msg.role === 'assistant' &&
            !msg.isStreaming &&
            !msg.source &&
            !isStreaming
          }
          llmReviewLoading={loadingMsgId === msg.id}
          onLlmReview={() => handleLlmReview(msg.id, msg.content)}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
