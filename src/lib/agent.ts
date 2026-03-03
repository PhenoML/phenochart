import type { AgentInfo, FhirBundle } from '../types/chat';
import { getConfig, createClient } from './config';

export async function captureScreenshot(): Promise<{ dataUrl: string; base64: string }> {
  const response = await browser.runtime.sendMessage({ type: 'CAPTURE_TAB' });
  if (!response?.dataUrl) {
    throw new Error('Failed to capture screenshot.');
  }
  const dataUrl = response.dataUrl as string;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return { dataUrl, base64 };
}

export async function extractFhirResources(base64Image: string): Promise<FhirBundle> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const response = await client.lang2Fhir.extractMultipleFhirResourcesFromADocument({
    version: 'R4',
    content: base64Image,
  });

  const entries = response.bundle?.entry ?? [];
  if (entries.length === 0) {
    throw new Error('No FHIR resources could be extracted from the screenshot.');
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries.map((e) => ({ resource: e.resource ?? {} })),
  };
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const response = await client.agent.list();
  return (response.agents ?? [])
    .filter((a) => a.id && a.name)
    .map((a) => ({
      id: a.id!,
      name: a.name!,
      description: a.description,
      tags: a.tags,
    }));
}

export interface StreamChatOptions {
  agentId: string;
  message: string;
  sessionId?: string;
  patientId?: string;
  signal?: AbortSignal;
}

export async function* streamAgentChat(
  options: StreamChatOptions,
): AsyncGenerator<{ type: string; content?: string; sessionId?: string }> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const request = {
    agent_id: options.agentId,
    message: options.message,
    ...(options.sessionId && { session_id: options.sessionId }),
    ...(options.patientId && { 'X-Phenoml-On-Behalf-Of': `Patient/${options.patientId}` }),
  } as unknown as Parameters<typeof client.agent.streamChat>[0];

  const stream = await client.agent.streamChat(request);

  for await (const event of stream) {
    if (options.signal?.aborted) break;

    yield {
      type: event.type ?? '',
      content: event.content,
      sessionId: event.session_id,
    };
  }
}

/**
 * Non-streaming variant: consumes the full agent stream and returns the
 * accumulated response. Used by the background service worker where there
 * is no React state to stream deltas into.
 */
export async function sendAgentChat(
  options: Omit<StreamChatOptions, 'signal'>,
): Promise<{ content: string; sessionId: string | null }> {
  let content = '';
  let sessionId: string | null = null;

  for await (const event of streamAgentChat(options)) {
    if (event.type === 'message_start' && event.sessionId) {
      sessionId = event.sessionId;
    }
    if (event.type === 'content_delta' && event.content) {
      content += event.content;
    }
  }

  return { content, sessionId };
}
