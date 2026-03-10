import { useReducer } from 'react';
import type { CdsState } from '../types/cds';
import type { ChatMessage, AgentInfo, TraceData } from '../types/chat';

export type CdsAction =
  | { type: 'SELECT_AGENT'; agent: AgentInfo }
  | { type: 'ADD_USER_MESSAGE'; id: string; content: string; agentContext?: string }
  | { type: 'START_STREAM'; messageId: string }
  | { type: 'STREAM_DELTA'; messageId: string; delta: string }
  | { type: 'STREAM_END'; messageId: string }
  | { type: 'SET_SESSION_ID'; sessionId: string | null }
  | { type: 'LOAD_SESSION'; messages: ChatMessage[]; sessionId: string | null }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_TRACES'; traces: Map<string, TraceData> }
  | { type: 'NEW_CONVERSATION' };

export const cdsInitialState: CdsState = {
  phase: 'idle',
  messages: [],
  isStreaming: false,
  sessionId: null,
  selectedAgent: null,
  error: null,
};

export function cdsReducer(state: CdsState, action: CdsAction): CdsState {
  switch (action.type) {
    case 'SELECT_AGENT':
      return { ...state, selectedAgent: action.agent };

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        phase: 'chatting',
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: 'user',
            content: action.content,
            timestamp: new Date().toISOString(),
            ...(action.agentContext && { agentContext: action.agentContext }),
          },
        ],
        error: null,
      };

    case 'START_STREAM':
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages,
          {
            id: action.messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
          },
        ],
      };

    case 'STREAM_DELTA': {
      const messages = state.messages.map((m) =>
        m.id === action.messageId ? { ...m, content: m.content + action.delta } : m,
      );
      return { ...state, messages };
    }

    case 'STREAM_END': {
      const messages = state.messages.map((m) =>
        m.id === action.messageId ? { ...m, isStreaming: false } : m,
      );
      return { ...state, isStreaming: false, messages };
    }

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId };

    case 'LOAD_SESSION':
      return {
        ...state,
        phase: 'chatting',
        messages: action.messages,
        sessionId: action.sessionId,
        error: null,
      };

    case 'SET_ERROR':
      return { ...state, phase: 'error', isStreaming: false, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null, phase: state.messages.length > 0 ? 'chatting' : 'idle' };

    case 'SET_TRACES': {
      const messages = state.messages.map((m) => {
        const trace = action.traces.get(m.id);
        return trace ? { ...m, trace } : m;
      });
      return { ...state, messages };
    }

    case 'NEW_CONVERSATION':
      return { ...cdsInitialState, selectedAgent: state.selectedAgent };

    default:
      return state;
  }
}

export function useCdsState() {
  return useReducer(cdsReducer, cdsInitialState);
}
