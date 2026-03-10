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

export interface CreateAgentParams {
  name: string;
  description?: string;
  systemPrompt: string;
}

export async function createAgentWithPrompt(
  params: CreateAgentParams,
): Promise<{ agentId: string; agentName: string }> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const promptResponse = await client.agent.prompts.create({
    name: `${params.name} — System Prompt`,
    content: params.systemPrompt,
    ...(params.description && { description: params.description }),
  });

  const promptId = (promptResponse as { data?: { id?: string } }).data?.id;
  if (!promptId) throw new Error('Failed to create prompt: no ID returned.');

  const agentResponse = await client.agent.create({
    name: params.name,
    prompts: [promptId],
    provider: config.fhirProviderId,
    ...(params.description && { description: params.description }),
  } as Parameters<typeof client.agent.create>[0]);

  const data = (agentResponse as { data?: { id?: string; name?: string } }).data;
  if (!data?.id) throw new Error('Failed to create agent: no ID returned.');

  return { agentId: data.id, agentName: data.name ?? params.name };
}

/**
 * Extract the SDK's internally-cached OAuth token from the client's auth
 * provider.  The SDK already handles token fetch, caching, and refresh via
 * OAuthAuthProvider – reusing it avoids a redundant /v2/auth/token call and
 * the silent-failure path that existed in the previous manual fetch.
 */
async function getSdkToken(
  client: ReturnType<typeof createClient>,
): Promise<string | undefined> {
  try {
    const authProvider = (client as unknown as { _options: { authProvider: { getToken: () => Promise<string> } } })
      ._options.authProvider;
    return await authProvider.getToken();
  } catch {
    return undefined;
  }
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

  // Reuse the SDK's own cached OAuth token for the X-Phenoml-Fhir-Provider
  // header so the agent can query FHIR even if it wasn't created with a provider.
  let fhirProviderHeader: string | undefined;
  if (config.fhirProviderId) {
    const token = await getSdkToken(client);
    console.log('[streamAgentChat] token obtained:', !!token, 'fhirProviderId:', config.fhirProviderId);
    if (token) {
      fhirProviderHeader = `${config.fhirProviderId}:${token}`;
    }
  } else {
    console.warn('[streamAgentChat] No fhirProviderId configured');
  }

  const request = {
    agent_id: options.agentId,
    message: options.message,
    ...(options.sessionId && { session_id: options.sessionId }),
    ...(options.patientId && { 'X-Phenoml-On-Behalf-Of': `Patient/${options.patientId}` }),
    ...(fhirProviderHeader && { 'X-Phenoml-Fhir-Provider': fhirProviderHeader }),
  } as unknown as Parameters<typeof client.agent.streamChat>[0];

  console.log('[streamAgentChat] request keys:', Object.keys(request), 'patientId:', options.patientId);

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
