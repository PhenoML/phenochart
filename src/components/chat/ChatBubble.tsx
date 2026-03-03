import type { ChatMessage } from '../../types/chat';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-pheno-accent-light text-pheno-text-primary'
            : 'border-l-2 border-pheno-accent bg-pheno-bg-panel text-pheno-text-primary shadow-sm'
        }`}
      >
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed">
          {message.content}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-pheno-accent" />
          )}
        </p>
        <p
          className={`mt-1 font-mono text-[10px] ${
            isUser ? 'text-pheno-text-tertiary' : 'text-pheno-text-tertiary'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
