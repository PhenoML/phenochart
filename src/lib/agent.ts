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

// Cache OAuth token to avoid redundant fetches on every message
let cachedToken: { value: string; instanceUrl: string; expiresAt: number } | null = null;

async function getOrFetchToken(config: {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
}): Promise<string | undefined> {
  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.instanceUrl === config.instanceUrl &&
    cachedToken.expiresAt > now
  ) {
    return cachedToken.value;
  }

  const tokenRes = await fetch(`${config.instanceUrl}/v2/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!tokenRes.ok) return undefined;

  const { access_token, expires_in } = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!access_token) return undefined;

  // Default to 50 minutes if expires_in not provided; refresh 60s early
  const ttlMs = ((expires_in ?? 3000) - 60) * 1000;
  cachedToken = {
    value: access_token,
    instanceUrl: config.instanceUrl,
    expiresAt: now + ttlMs,
  };
  return access_token;
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

  // Fetch a cached OAuth token so we can pass X-Phenoml-Fhir-Provider,
  // ensuring the agent can query FHIR even if it wasn't created with a provider.
  let fhirProviderHeader: string | undefined;
  if (config.fhirProviderId) {
    try {
      const token = await getOrFetchToken(config);
      if (token) {
        fhirProviderHeader = `${config.fhirProviderId}:${token}`;
      }
    } catch {
      // Token fetch failed — continue without FHIR provider header
    }
  }

  const request = {
    agent_id: options.agentId,
    message: options.message,
    ...(options.sessionId && { session_id: options.sessionId }),
    ...(options.patientId && { 'X-Phenoml-On-Behalf-Of': `Patient/${options.patientId}` }),
    ...(fhirProviderHeader && { 'X-Phenoml-Fhir-Provider': fhirProviderHeader }),
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
