import type { Encounter } from '../types';
import { getConfig } from './config';
import { getToken } from './construe';

// Minimal FHIR R4 types for fields we consume
interface FhirHumanName {
  use?: string;
  given?: string[];
  family?: string;
}

interface FhirPatient {
  id: string;
  name?: FhirHumanName[];
  birthDate?: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

interface FhirEncounter {
  id: string;
  text?: { div?: string };
  period?: { start?: string };
  type?: Array<{ text?: string; coding?: Array<{ display?: string }> }>;
  class?: { display?: string };
  diagnosis?: Array<{ condition?: { reference?: string } }>;
}

interface FhirCondition {
  id: string;
  code?: {
    text?: string;
    coding?: Array<{ display?: string }>;
  };
  note?: Array<{ text: string }>;
}

interface FhirClinicalImpression {
  id: string;
  description?: string;
  summary?: string;
  note?: Array<{ text: string }>;
  finding?: Array<{
    itemCodeableConcept?: { text?: string; coding?: Array<{ display?: string }> };
    basis?: string;
  }>;
}

interface FhirBundle<T> {
  resourceType: string;
  entry?: Array<{ resource?: T }>;
}

// --- Field helpers ---

function stripHtml(html: string): string {
  return new DOMParser()
    .parseFromString(html, 'text/html')
    .body.textContent?.trim() ?? '';
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthday) age--;
  return age;
}

function mapGender(gender: FhirPatient['gender']): 'M' | 'F' | 'O' {
  if (gender === 'male') return 'M';
  if (gender === 'female') return 'F';
  return 'O';
}

function patientDisplayName(patient: FhirPatient): string {
  const name = patient.name?.find((n) => n.use === 'official') ?? patient.name?.[0];
  if (!name) return 'Unknown Patient';
  const given = name.given?.join(' ') ?? '';
  const family = name.family ?? '';
  return [given, family].filter(Boolean).join(' ') || 'Unknown Patient';
}

function encounterTypeLabel(enc: FhirEncounter): string {
  return (
    enc.type?.[0]?.text ??
    enc.type?.[0]?.coding?.[0]?.display ??
    enc.class?.display ??
    'Encounter'
  );
}

function buildNarrative(
  enc: FhirEncounter,
  conditions: FhirCondition[],
  impressions: FhirClinicalImpression[],
): string {
  const parts: string[] = [];

  // ClinicalImpression notes — richest clinical text
  for (const imp of impressions) {
    if (imp.description) parts.push(imp.description);
    if (imp.summary) parts.push(imp.summary);
    for (const note of imp.note ?? []) {
      if (note.text) parts.push(note.text);
    }
    for (const finding of imp.finding ?? []) {
      const label =
        finding.itemCodeableConcept?.text ?? finding.itemCodeableConcept?.coding?.[0]?.display;
      if (label) parts.push(label);
      if (finding.basis) parts.push(finding.basis);
    }
  }

  // Condition descriptions and notes
  for (const cond of conditions) {
    const label = cond.code?.text ?? cond.code?.coding?.[0]?.display;
    if (label) parts.push(label);
    for (const note of cond.note ?? []) {
      if (note.text) parts.push(note.text);
    }
  }

  // Encounter text.div as last resort
  if (enc.text?.div) {
    parts.push(stripHtml(enc.text.div));
  }

  return parts.join('\n\n').trim();
}

// --- Internal mapping ---

function mapToEncounter(enc: FhirEncounter, patient: FhirPatient, narrative: string): Encounter {
  return {
    id: enc.id,
    patient: {
      name: patientDisplayName(patient),
      age: patient.birthDate ? calcAge(patient.birthDate) : 0,
      sex: mapGender(patient.gender),
    },
    date: enc.period?.start?.split('T')[0] ?? '',
    type: encounterTypeLabel(enc),
    narrative,
  };
}

// --- Generic FHIR fetch ---

async function fetchFhirResource<T>(
  instanceUrl: string,
  fhirProviderId: string,
  token: string,
  fhirPath: string,
): Promise<T> {
  const url = `${instanceUrl}/fhir-provider/${fhirProviderId}/fhir/${fhirPath}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`FHIR fetch failed (${fhirPath}): ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchClinicalImpressions(
  instanceUrl: string,
  fhirProviderId: string,
  token: string,
  encounterId: string,
): Promise<FhirClinicalImpression[]> {
  try {
    const bundle = await fetchFhirResource<FhirBundle<FhirClinicalImpression>>(
      instanceUrl,
      fhirProviderId,
      token,
      `ClinicalImpression?encounter=Encounter/${encounterId}`,
    );
    console.log('[PhenoChart] Raw ClinicalImpression bundle:', bundle);
    return (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter((r): r is FhirClinicalImpression => !!r);
  } catch (err) {
    console.log('[PhenoChart] ClinicalImpression fetch error:', err);
    return [];
  }
}

async function fetchConditions(
  instanceUrl: string,
  fhirProviderId: string,
  token: string,
  refs: string[],
): Promise<FhirCondition[]> {
  const results = await Promise.allSettled(
    refs.map((ref) => fetchFhirResource<FhirCondition>(instanceUrl, fhirProviderId, token, ref)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<FhirCondition> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// --- Public API ---

export async function fetchRealEncounter(
  patientId: string,
  encounterId: string,
): Promise<Encounter> {
  const config = await getConfig();
  if (!config) {
    throw new Error('PhenoML credentials not configured. Open extension options to set them up.');
  }
  const token = await getToken(config);

  // Parallel fetch 1: Encounter, Patient, ClinicalImpressions
  const [fhirEncounter, fhirPatient, impressions] = await Promise.all([
    fetchFhirResource<FhirEncounter>(
      config.instanceUrl,
      config.fhirProviderId,
      token,
      `Encounter/${encounterId}`,
    ),
    fetchFhirResource<FhirPatient>(
      config.instanceUrl,
      config.fhirProviderId,
      token,
      `Patient/${patientId}`,
    ),
    fetchClinicalImpressions(config.instanceUrl, config.fhirProviderId, token, encounterId),
  ]);

  // Parallel fetch 2: Conditions linked from encounter.diagnosis[]
  const conditionRefs = (fhirEncounter.diagnosis ?? [])
    .map((d) => d.condition?.reference)
    .filter((r): r is string => !!r);

  const conditions = await fetchConditions(
    config.instanceUrl,
    config.fhirProviderId,
    token,
    conditionRefs,
  );

  console.log('[PhenoChart] Raw FHIR Encounter:', fhirEncounter);
  console.log('[PhenoChart] Raw FHIR Patient:', fhirPatient);
  console.log('[PhenoChart] ClinicalImpressions:', impressions);
  console.log('[PhenoChart] Conditions:', conditions);

  const narrative = buildNarrative(fhirEncounter, conditions, impressions);
  const encounter = mapToEncounter(fhirEncounter, fhirPatient, narrative);
  console.log('[PhenoChart] Mapped Encounter:', encounter);
  return encounter;
}
