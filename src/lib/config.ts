export interface PhenoConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
}

const CONFIG_KEY = 'phenoml_config';

export async function getConfig(): Promise<PhenoConfig | null> {
  const result = await browser.storage.local.get(CONFIG_KEY);
  const config = result[CONFIG_KEY] as PhenoConfig | undefined;
  if (!config?.instanceUrl || !config?.clientId || !config?.clientSecret) {
    return null;
  }
  return config;
}

export async function saveConfig(config: PhenoConfig): Promise<void> {
  await browser.storage.local.set({ [CONFIG_KEY]: config });
  // Clear cached JWT so the next API call fetches a fresh token with the new credentials
  await browser.storage.session.remove('phenoml_jwt');
}
