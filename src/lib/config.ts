import { PhenoMLClient } from 'phenoml';
import type { CodeSystem } from '../types';

export const DEFAULT_CODE_SYSTEMS: CodeSystem[] = ['ICD-10-CM'];

export interface PhenoConfig {
  instanceUrl: string;
  username: string;
  password: string;
  fhirProviderId: string;
  codeSystems: CodeSystem[];
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
  });
}
