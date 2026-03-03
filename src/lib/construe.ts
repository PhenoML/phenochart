import type { ExtractedCode, CodeSystem } from '../types';
import { getConfig, createClient } from './config';

type ValidationMethod = 'none' | 'simple' | 'medication_search';

const SYSTEM_CONFIGS: Record<CodeSystem, { name: string; version: string; validationMethod: ValidationMethod }> = {
  'ICD-10-CM':         { name: 'ICD-10-CM',         version: '2025',     validationMethod: 'simple' },
  'ICD-10-PCS':        { name: 'ICD-10-PCS',         version: '2025',     validationMethod: 'simple' },
  'RXNORM':            { name: 'RXNORM',              version: '11042024', validationMethod: 'medication_search' },
  'LOINC':             { name: 'LOINC',               version: '2.78',     validationMethod: 'simple' },
  'HPO':               { name: 'HPO',                 version: '2025',     validationMethod: 'simple' },
  'CPT':               { name: 'CPT',                 version: '2025',     validationMethod: 'simple' },
  'SNOMED_CT_US_LITE': { name: 'SNOMED_CT_US_LITE',   version: '20240901', validationMethod: 'simple' },
};

export async function extractCodes(narrative: string): Promise<ExtractedCode[]> {
  const config = await getConfig();
  if (!config) {
    throw new Error('PhenoML credentials not configured. Open extension options to set them up.');
  }
  const client = createClient(config);

  const responses = await Promise.all(
    config.codeSystems.map((system) => {
      const { name, version, validationMethod } = SYSTEM_CONFIGS[system];
      return client.construe.extractCodes({
        text: narrative,
        system: { name, version },
        config: {
          chunking_method: 'sentences',
          code_similarity_filter: 0.9,
          validation_method: validationMethod,
          include_rationale: true,
          include_citations: true,
        },
      });
    }),
  );

  return config.codeSystems.flatMap((system, i) =>
    responses[i].codes.map((c, j) => ({
      id: `code-${system.toLowerCase()}-${j}`,
      code: c.code,
      system,
      description: c.description,
      reason: c.reason ?? '',
      valid: c.valid,
      citations: c.citations ?? [],
    })),
  );
}
