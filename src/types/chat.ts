export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}

export type ChatPhase =
  | 'idle'
  | 'capturing'
  | 'preview'
  | 'extracting_fhir'
  | 'summarizing'
  | 'chatting'
  | 'error';

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  entry: Array<{ resource: Record<string, unknown> }>;
}

export interface ChatState {
  phase: ChatPhase;
  screenshotDataUrl: string | null;
  screenshotBase64: string | null;
  fhirBundle: FhirBundle | null;
  clinicalSummary: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  sessionId: string | null;
  selectedAgent: AgentInfo | null;
  error: string | null;
}
