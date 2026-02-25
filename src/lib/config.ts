import type { CodeSystem } from '../types';

export const DEFAULT_CODE_SYSTEMS: CodeSystem[] = ['ICD-10-CM'];

export interface PhenoConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  fhirProviderId: string;
  codeSystems: CodeSystem[];
}

const CONFIG_KEY = 'phenoml_config';

export async function getConfig(): Promise<PhenoConfig | null> {
  const result = await browser.storage.local.get(CONFIG_KEY);
  const config = result[CONFIG_KEY] as Partial<PhenoConfig> | undefined;
  if (
    !config?.instanceUrl ||
    !config?.clientId ||
    !config?.clientSecret ||
    !config?.fhirProviderId
  ) {
    return null;
  }
  return {
    instanceUrl: config.instanceUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    fhirProviderId: config.fhirProviderId,
    codeSystems: config.codeSystems?.length ? config.codeSystems : DEFAULT_CODE_SYSTEMS,
  };
}

export async function saveConfig(config: PhenoConfig): Promise<void> {
  await browser.storage.local.set({ [CONFIG_KEY]: config });
  // Clear cached JWT so the next API call fetches a fresh token with the new credentials
  await browser.storage.session.remove('phenoml_jwt');
}
