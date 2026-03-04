import { useReducer } from 'react';
import type { ChatState, ChatPhase, ChatMessage, AgentInfo, FhirBundle } from '../types/chat';

type Action =
  | { type: 'SELECT_AGENT'; agent: AgentInfo }
  | { type: 'START_CAPTURE' }
  | { type: 'SCREENSHOT_CAPTURED'; dataUrl: string; base64: string }
  | { type: 'CONFIRM_SCREENSHOT' }
  | { type: 'RETAKE' }
  | { type: 'FHIR_EXTRACTED'; bundle: FhirBundle }
  | { type: 'ADD_USER_MESSAGE'; id: string; content: string }
  | { type: 'START_STREAM'; messageId: string }
  | { type: 'STREAM_DELTA'; messageId: string; delta: string }
  | { type: 'STREAM_END'; messageId: string }
  | { type: 'SET_SESSION_ID'; sessionId: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'LOAD_TASK'; messages: ChatMessage[]; sessionId: string | null; agentId: string; agentName: string }
  | { type: 'RESET' };

const initialState: ChatState = {
  phase: 'idle',
  screenshotDataUrl: null,
  screenshotBase64: null,
  fhirBundle: null,
  messages: [],
  isStreaming: false,
  sessionId: null,
  selectedAgent: null,
  error: null,
};

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'SELECT_AGENT':
      return { ...state, selectedAgent: action.agent };

    case 'START_CAPTURE':
      return { ...state, phase: 'capturing', error: null };

    case 'SCREENSHOT_CAPTURED':
      return { ...state, phase: 'preview', screenshotDataUrl: action.dataUrl, screenshotBase64: action.base64 };

    case 'CONFIRM_SCREENSHOT':
      return { ...state, phase: 'extracting_fhir' };

    case 'RETAKE':
      return { ...state, phase: 'idle', screenshotDataUrl: null, screenshotBase64: null };

    case 'FHIR_EXTRACTED':
      return { ...state, phase: 'chatting', fhirBundle: action.bundle };

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: 'user',
            content: action.content,
            timestamp: new Date().toISOString(),
          },
        ],
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

    case 'SET_ERROR':
      return { ...state, phase: 'error', isStreaming: false, error: action.error };

    case 'LOAD_TASK':
      return {
        ...initialState,
        phase: 'chatting',
        messages: action.messages,
        sessionId: action.sessionId,
        selectedAgent: { id: action.agentId, name: action.agentName },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useChatState() {
  return useReducer(reducer, initialState);
}

export type { Action as ChatAction };
