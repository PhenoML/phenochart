import { PhenoMLClient } from 'phenoml';
import type { CodeSystem } from '../types';

export const DEFAULT_CODE_SYSTEMS: CodeSystem[] = ['ICD-10-CM'];

export interface PhenoConfig {
  instanceUrl: string;
  username: string;
  password: string;
  fhirProviderId: string;
  codeSystems: CodeSystem[];
  llmApiUrl?: string;
  llmApiKey?: string;
  llmApiKeyHeader?: string;
  llmModel?: string;
}

const CONFIG_KEY = 'phenoml_config';

export async function getConfig(): Promise<PhenoConfig | null> {
  const result = await browser.storage.local.get(CONFIG_KEY);
  const config = result[CONFIG_KEY] as Partial<PhenoConfig> | undefined;
  if (
    !config?.instanceUrl ||
    !config?.username ||
    !config?.password ||
    !config?.fhirProviderId
  ) {
    return null;
  }
  return {
    instanceUrl: config.instanceUrl,
    username: config.username,
    password: config.password,
    fhirProviderId: config.fhirProviderId,
    codeSystems: config.codeSystems?.length ? config.codeSystems : DEFAULT_CODE_SYSTEMS,
    ...(config.llmApiUrl && { llmApiUrl: config.llmApiUrl }),
    ...(config.llmApiKey && { llmApiKey: config.llmApiKey }),
    ...(config.llmApiKeyHeader && { llmApiKeyHeader: config.llmApiKeyHeader }),
    ...(config.llmModel && { llmModel: config.llmModel }),
  };
}

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  apiKeyHeader: string;
  model: string;
}

export async function getLlmConfig(): Promise<LlmConfig | null> {
  const result = await browser.storage.local.get(CONFIG_KEY);
  const config = result[CONFIG_KEY] as Partial<PhenoConfig> | undefined;
  if (!config?.llmApiUrl || !config?.llmApiKey || !config?.llmModel) return null;
  return {
    apiUrl: config.llmApiUrl,
    apiKey: config.llmApiKey,
    apiKeyHeader: config.llmApiKeyHeader || 'Authorization',
    model: config.llmModel,
  };
}

export async function saveConfig(config: PhenoConfig): Promise<void> {
  await browser.storage.local.set({ [CONFIG_KEY]: config });
}

export function createClient(config: PhenoConfig): PhenoMLClient {
  return new PhenoMLClient({
    username: config.username,
    password: config.password,
    baseUrl: config.instanceUrl,
    timeoutInSeconds: 120,
  } as PhenoMLClient.Options & { timeoutInSeconds: number });
}
