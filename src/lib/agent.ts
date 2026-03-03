import type { AgentInfo, FhirBundle } from '../types/chat';
import { getConfig, createClient } from './config';

const FHIR_RESOURCE_TYPES = [
  'condition-encounter-diagnosis',
  'condition-problems-health-concerns',
  'medicationrequest',
  'observation-clinical-result',
  'observation-lab',
  'procedure',
  'patient',
  'vital-signs',
] as const;

export async function captureScreenshot(): Promise<string> {
  const response = await browser.runtime.sendMessage({ type: 'CAPTURE_TAB' });
  if (!response?.dataUrl) {
    throw new Error('Failed to capture screenshot.');
  }
  // Strip the data URL prefix to get raw base64
  return (response.dataUrl as string).replace(/^data:image\/\w+;base64,/, '');
}

export async function extractFhirResources(base64Image: string): Promise<FhirBundle> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const results = await Promise.allSettled(
    FHIR_RESOURCE_TYPES.map((resource) =>
      client.lang2Fhir.document({
        version: 'R4',
        resource: resource as unknown,
        content: base64Image,
      } as Parameters<typeof client.lang2Fhir.document>[0]),
    ),
  );

  const entries: FhirBundle['entry'] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const resource = result.value as Record<string, unknown>;
      if (resource.resourceType) {
        entries.push({ resource });
      }
    }
  }

  if (entries.length === 0) {
    throw new Error('No FHIR resources could be extracted from the screenshot.');
  }

  return { resourceType: 'Bundle', type: 'collection', entry: entries };
}

export async function createSummary(fhirBundle: FhirBundle): Promise<string> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const response = await client.summary.create({
    fhir_resources: fhirBundle as unknown as Parameters<typeof client.summary.create>[0]['fhir_resources'],
    mode: 'ips',
  });

  if (!response.summary) {
    throw new Error('Summary generation returned no content.');
  }
  return response.summary;
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
