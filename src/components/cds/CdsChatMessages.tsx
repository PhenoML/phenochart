import { useEffect, useRef } from 'react';
import { CdsChatBubble } from './CdsChatBubble';
import type { ChatMessage } from '../../types/chat';

interface Props {
  messages: ChatMessage[];
}

export function CdsChatMessages({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <CdsChatBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
