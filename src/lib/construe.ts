import type { ExtractedCode, CodeSystem } from '../types';
import { getConfig, type PhenoConfig } from './config';

const TOKEN_KEY = 'phenoml_jwt';
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes (conservative estimate)

interface StoredToken {
  value: string;
  expiresAt: number;
}

interface ConstrueApiCode {
  code: string;
  description: string;
  reason: string;
  valid: boolean;
  citations: Array<{ text: string; begin_offset: number; end_offset: number }>;
}

interface ConstrueApiResponse {
  system: { name: string; version: string };
  codes: ConstrueApiCode[];
}

const SYSTEM_CONFIGS: Record<CodeSystem, { name: string; version: string; validationMethod: string }> = {
  'ICD-10-CM':       { name: 'ICD-10-CM',       version: '2025',     validationMethod: 'simple' },
  'ICD-10-PCS':      { name: 'ICD-10-PCS',      version: '2025',     validationMethod: 'simple' },
  'RXNORM':          { name: 'RXNORM',           version: '11042024', validationMethod: 'medication_search' },
  'LOINC':           { name: 'LOINC',            version: '2.78',     validationMethod: 'simple' },
  'HPO':             { name: 'HPO',              version: '2025',     validationMethod: 'simple' },
  'CPT':             { name: 'CPT',              version: '2025',     validationMethod: 'simple' },
  'SNOMED_CT_US_LITE': { name: 'SNOMED_CT_US_LITE', version: '20240901', validationMethod: 'simple' },
};

export async function getToken(config: PhenoConfig): Promise<string> {
  const result = await browser.storage.session.get(TOKEN_KEY);
  const stored = result[TOKEN_KEY] as StoredToken | undefined;

  if (stored && stored.expiresAt > Date.now() + 60_000) {
    return stored.value;
  }

  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
  const response = await fetch(`${config.instanceUrl}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) {
    throw new Error(`PhenoML auth failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { token: string };
  const token: StoredToken = { value: data.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  await browser.storage.session.set({ [TOKEN_KEY]: token });

  return data.token;
}

async function callExtract(
  config: PhenoConfig,
  token: string,
  text: string,
  system: CodeSystem,
): Promise<ConstrueApiResponse> {
  const { name, version, validationMethod } = SYSTEM_CONFIGS[system];

  const response = await fetch(`${config.instanceUrl}/construe/extract`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      text,
      system: { name, version },
      config: {
        chunking_method: 'sentences',
        code_similarity_filter: 0.9,
        validation_method: validationMethod,
        include_rationale: true,
        include_citations: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Construe extract failed (${system}): ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<ConstrueApiResponse>;
}

function normalizeCode(apiCode: ConstrueApiCode, system: CodeSystem, index: number): ExtractedCode {
  return {
    id: `code-${system.toLowerCase()}-${index}`,
    code: apiCode.code,
    system,
    description: apiCode.description,
    reason: apiCode.reason,
    valid: apiCode.valid,
    citations: apiCode.citations,
  };
}

export async function extractCodes(narrative: string): Promise<ExtractedCode[]> {
  const config = await getConfig();
  if (!config) {
    throw new Error('PhenoML credentials not configured. Open extension options to set them up.');
  }
  const token = await getToken(config);

  const responses = await Promise.all(
    config.codeSystems.map((system) => callExtract(config, token, narrative, system)),
  );

  return config.codeSystems.flatMap((system, i) =>
    responses[i].codes.map((c, j) => normalizeCode(c, system, j)),
  );
}
