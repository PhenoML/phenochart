import type { ExtractedCode } from '../types';
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

async function getToken(config: PhenoConfig): Promise<string> {
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
  system: 'ICD-10-CM' | 'RXNORM',
): Promise<ConstrueApiResponse> {
  const systemConfig =
    system === 'ICD-10-CM'
      ? { name: 'ICD-10-CM', version: '2025' }
      : { name: 'RXNORM', version: '11042024' };

  const validationMethod = system === 'ICD-10-CM' ? 'simple' : 'medication_search';

  const response = await fetch(`${config.instanceUrl}/construe/extract`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      text,
      system: systemConfig,
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

function normalizeCode(
  apiCode: ConstrueApiCode,
  system: 'ICD-10-CM' | 'RXNORM',
  index: number,
): ExtractedCode {
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

  const [icdResponse, rxResponse] = await Promise.all([
    callExtract(config, token, narrative, 'ICD-10-CM'),
    callExtract(config, token, narrative, 'RXNORM'),
  ]);

  const conditions = icdResponse.codes.map((c, i) => normalizeCode(c, 'ICD-10-CM', i));
  const medications = rxResponse.codes.map((c, i) => normalizeCode(c, 'RXNORM', i));

  return [...conditions, ...medications];
}
