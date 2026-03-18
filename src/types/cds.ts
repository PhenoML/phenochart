import type { ChatMessage, AgentInfo } from './chat';

export type CdsPhase = 'idle' | 'loading' | 'chatting' | 'error';

export interface CdsState {
  phase: CdsPhase;
  messages: ChatMessage[];
  isStreaming: boolean;
  sessionId: string | null;
  selectedAgent: AgentInfo | null;
  error: string | null;
}

export interface CdsSession {
  sessionId: string | null;
  messages: ChatMessage[];
  lastUpdated: string;
}
