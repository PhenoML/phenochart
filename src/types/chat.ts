export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  fhirJson?: string;
  source?: string;
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
  | 'chatting'
  | 'error';

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  entry: Array<{ resource: Record<string, unknown> }>;
}

export type TaskStatus =
  | 'extracting_fhir'
  | 'chatting'
  | 'completed'
  | 'error';

export interface BackgroundTask {
  id: string;
  status: TaskStatus;
  agentId: string;
  agentName: string;
  userPrompt: string;
  sourceUrl: string;
  screenshotDataUrl: string | null;
  screenshotBase64: string | null;
  fhirBundle: FhirBundle | null;
  messages: ChatMessage[];
  sessionId: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ChatState {
  phase: ChatPhase;
  screenshotDataUrl: string | null;
  screenshotBase64: string | null;
  fhirBundle: FhirBundle | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  sessionId: string | null;
  selectedAgent: AgentInfo | null;
  error: string | null;
}
