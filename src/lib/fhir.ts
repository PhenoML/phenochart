import type { Encounter } from '../types';
import type { MockPatient } from '../mock/patient';
import { getConfig, createClient } from './config';

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
  reasonCode?: Array<{ text?: string; coding?: Array<{ display?: string }> }>;
}

interface FhirCondition {
  id: string;
  code?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  note?: Array<{ text: string }>;
  onsetDateTime?: string;
  clinicalStatus?: {
    coding?: Array<{ code?: string }>;
  };
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

interface FhirMedicationRequest {
  id: string;
  status?: string;
  medicationCodeableConcept?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  dosageInstruction?: Array<{
    text?: string;
    timing?: { code?: { text?: string } };
    doseAndRate?: Array<{
      doseQuantity?: { value?: number; unit?: string };
    }>;
  }>;
}

interface FhirAllergyIntolerance {
  id: string;
  code?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  reaction?: Array<{
    manifestation?: Array<{
      text?: string;
      coding?: Array<{ display?: string }>;
    }>;
    severity?: 'mild' | 'moderate' | 'severe';
  }>;
  criticality?: 'low' | 'high' | 'unable-to-assess';
}

interface FhirObservation {
  id: string;
  code?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
  effectiveDateTime?: string;
  interpretation?: Array<{
    coding?: Array<{ code?: string; display?: string }>;
  }>;
  status?: string;
}

interface FhirProcedure {
  id: string;
  code?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  performedDateTime?: string;
  performedPeriod?: { start?: string };
  status?: string;
}

interface FhirImmunization {
  id: string;
  vaccineCode?: {
    text?: string;
    coding?: Array<{ code?: string; system?: string; display?: string }>;
  };
  occurrenceDateTime?: string;
  status?: string;
}

interface FhirBundle<T> {
  resourceType: string;
  entry?: Array<{ resource?: T }>;
}

// --- Bundle extraction ---

function extractBundle<T>(bundle: FhirBundle<T>): T[] {
  return (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is T => !!r);
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

  // Encounter-linked condition labels and notes — tells Construe what is
  // already coded on this encounter so it can weigh extraction accordingly.
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

function mapToEncounter(
  enc: FhirEncounter,
  patient: FhirPatient,
  narrative: string,
  conditions: FhirCondition[],
  patientConditions: FhirCondition[],
): Encounter {
  const existingCodes = conditions
    .flatMap((c) => c.code?.coding ?? [])
    .map((coding) => coding.code)
    .filter((code): code is string => !!code);

  const problemListCodes: Record<string, string> = {};
  for (const cond of patientConditions) {
    for (const coding of cond.code?.coding ?? []) {
      if (coding.code) problemListCodes[coding.code] = cond.id;
    }
  }

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
    existingCodes,
    problemListCodes,
  };
}

// --- Generic FHIR fetch via SDK ---

async function fetchFhirResource<T>(
  fhirProviderId: string,
  fhirPath: string,
  client: ReturnType<typeof createClient>,
): Promise<T> {
  const result = await client.fhir.search(fhirProviderId, fhirPath);
  return result as T;
}

async function fetchClinicalImpressions(
  fhirProviderId: string,
  encounterId: string,
  client: ReturnType<typeof createClient>,
): Promise<FhirClinicalImpression[]> {
  try {
    const bundle = await fetchFhirResource<FhirBundle<FhirClinicalImpression>>(
      fhirProviderId,
      `ClinicalImpression?encounter=Encounter/${encounterId}`,
      client,
    );
    return (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter((r): r is FhirClinicalImpression => !!r);
  } catch (err) {
    return [];
  }
}

async function fetchPatientConditions(
  fhirProviderId: string,
  patientId: string,
  client: ReturnType<typeof createClient>,
): Promise<FhirCondition[]> {
  try {
    const bundle = await fetchFhirResource<FhirBundle<FhirCondition>>(
      fhirProviderId,
      `Condition?patient=Patient/${patientId}`,
      client,
    );
    return (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter((r): r is FhirCondition => !!r);
  } catch (err) {
    console.log('[PhenoChart] Patient conditions fetch error:', err);
    return [];
  }
}

async function fetchConditions(
  fhirProviderId: string,
  refs: string[],
  client: ReturnType<typeof createClient>,
): Promise<FhirCondition[]> {
  const results = await Promise.allSettled(
    refs.map((ref) => fetchFhirResource<FhirCondition>(fhirProviderId, ref, client)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<FhirCondition> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// --- FHIR-to-MockPatient mapping ---

function mapFhirCondition(
  c: FhirCondition,
): MockPatient['conditions'][number] {
  const coding = c.code?.coding?.[0];
  return {
    name: c.code?.text ?? coding?.display ?? 'Unknown condition',
    code: coding?.code ?? '',
    system: coding?.system ?? '',
    onsetDate: c.onsetDateTime?.split('T')[0] ?? '',
    status: c.clinicalStatus?.coding?.[0]?.code ?? 'unknown',
  };
}

function mapMedicationRequest(
  med: FhirMedicationRequest,
): MockPatient['medications'][number] {
  const name =
    med.medicationCodeableConcept?.text ??
    med.medicationCodeableConcept?.coding?.[0]?.display ??
    'Unknown medication';
  const instr = med.dosageInstruction?.[0];
  const doseQty = instr?.doseAndRate?.[0]?.doseQuantity;
  const dosage = doseQty
    ? `${doseQty.value ?? ''} ${doseQty.unit ?? ''}`.trim()
    : instr?.text ?? '';
  const frequency = instr?.timing?.code?.text ?? '';
  return { name, dosage, frequency, status: med.status ?? 'unknown' };
}

function mapAllergyIntolerance(
  allergy: FhirAllergyIntolerance,
): MockPatient['allergies'][number] {
  const substance =
    allergy.code?.text ??
    allergy.code?.coding?.[0]?.display ??
    'Unknown substance';
  const reaction = (allergy.reaction ?? [])
    .flatMap((r) =>
      (r.manifestation ?? []).map(
        (m) => m.text ?? m.coding?.[0]?.display,
      ),
    )
    .filter(Boolean)
    .join(', ') || 'Unknown reaction';
  const severity =
    allergy.reaction?.[0]?.severity ??
    (allergy.criticality === 'high'
      ? 'severe'
      : allergy.criticality === 'low'
        ? 'mild'
        : 'moderate');
  return { substance, reaction, severity };
}

function mapObservation(
  obs: FhirObservation,
): MockPatient['recentLabs'][number] {
  const value = obs.valueQuantity
    ? `${obs.valueQuantity.value ?? ''}`
    : obs.valueString ?? '';
  const unit = obs.valueQuantity?.unit ?? '';
  const interpCode = obs.interpretation?.[0]?.coding?.[0]?.code;
  const status: 'normal' | 'abnormal' | 'critical' =
    interpCode === 'HH' || interpCode === 'LL' || interpCode === 'AA'
      ? 'critical'
      : interpCode === 'H' || interpCode === 'L' || interpCode === 'A'
        ? 'abnormal'
        : 'normal';
  return {
    name: obs.code?.text ?? obs.code?.coding?.[0]?.display ?? 'Unknown lab',
    value,
    unit,
    date: obs.effectiveDateTime?.split('T')[0] ?? '',
    status,
  };
}

function mapEncounterSummary(
  enc: FhirEncounter,
  impressions?: FhirClinicalImpression[],
  linkedConditions?: FhirCondition[],
): MockPatient['pastEncounters'][number] {
  const type = encounterTypeLabel(enc);
  const parts: string[] = [];

  // Reason codes
  const reasons = (enc.reasonCode ?? [])
    .map((r) => r.text ?? r.coding?.[0]?.display)
    .filter(Boolean);
  if (reasons.length > 0) parts.push(reasons.join('; '));

  // ClinicalImpression notes — richest clinical text
  for (const imp of impressions ?? []) {
    if (imp.description) parts.push(imp.description);
    if (imp.summary) parts.push(imp.summary);
    for (const note of imp.note ?? []) {
      if (note.text) parts.push(note.text);
    }
  }

  // Linked conditions
  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.text ?? cond.code?.coding?.[0]?.display;
    if (label) parts.push(`Dx: ${label}`);
  }

  // Encounter text.div as last resort
  if (parts.length === 0 && enc.text?.div) {
    parts.push(stripHtml(enc.text.div));
  }

  if (parts.length === 0) parts.push(type);

  return {
    date: enc.period?.start?.split('T')[0] ?? '',
    type,
    summary: parts.join('. '),
  };
}

function mapVital(
  obs: FhirObservation,
): MockPatient['recentVitals'][number] {
  return {
    name: obs.code?.text ?? obs.code?.coding?.[0]?.display ?? 'Unknown vital',
    value: obs.valueQuantity
      ? `${obs.valueQuantity.value ?? ''}`
      : obs.valueString ?? '',
    unit: obs.valueQuantity?.unit ?? '',
    date: obs.effectiveDateTime?.split('T')[0] ?? '',
  };
}

function mapProcedure(
  proc: FhirProcedure,
): MockPatient['procedures'][number] {
  return {
    name:
      proc.code?.text ?? proc.code?.coding?.[0]?.display ?? 'Unknown procedure',
    date:
      proc.performedDateTime?.split('T')[0] ??
      proc.performedPeriod?.start?.split('T')[0] ??
      '',
    status: proc.status ?? 'unknown',
  };
}

function mapImmunization(
  imm: FhirImmunization,
): MockPatient['immunizations'][number] {
  return {
    name:
      imm.vaccineCode?.text ??
      imm.vaccineCode?.coding?.[0]?.display ??
      'Unknown vaccine',
    date: imm.occurrenceDateTime?.split('T')[0] ?? '',
    status: imm.status ?? 'unknown',
  };
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
  const client = createClient(config);

  // Parallel fetch 1: Encounter, Patient, ClinicalImpressions, all patient Conditions
  const [fhirEncounter, fhirPatient, impressions, patientConditions] = await Promise.all([
    fetchFhirResource<FhirEncounter>(config.fhirProviderId, `Encounter/${encounterId}`, client),
    fetchFhirResource<FhirPatient>(config.fhirProviderId, `Patient/${patientId}`, client),
    fetchClinicalImpressions(config.fhirProviderId, encounterId, client),
    fetchPatientConditions(config.fhirProviderId, patientId, client),
  ]);

  // Parallel fetch 2: Conditions linked from encounter.diagnosis[]
  const conditionRefs = (fhirEncounter.diagnosis ?? [])
    .map((d) => d.condition?.reference)
    .filter((r): r is string => !!r);

  const conditions = await fetchConditions(config.fhirProviderId, conditionRefs, client);

  const narrative = buildNarrative(fhirEncounter, conditions, impressions);
  const encounter = mapToEncounter(fhirEncounter, fhirPatient, narrative, conditions, patientConditions);
  return encounter;
}

export async function fetchCdsPatientContext(
  patientId: string,
): Promise<{ patient: MockPatient; warnings: string[] }> {
  const config = await getConfig();
  if (!config) {
    throw new Error(
      'PhenoML credentials not configured. Open extension options to set them up.',
    );
  }
  const client = createClient(config);
  const pid = config.fhirProviderId;

  // Date filter for labs: last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const dateFilter = twelveMonthsAgo.toISOString().split('T')[0];

  const warnings: string[] = [];

  const [
    patientResult,
    conditionsResult,
    medsResult,
    allergiesResult,
    labsResult,
    vitalsResult,
    encountersResult,
    proceduresResult,
    immunizationsResult,
  ] = await Promise.allSettled([
    fetchFhirResource<FhirPatient>(pid, `Patient/${patientId}`, client),
    fetchFhirResource<FhirBundle<FhirCondition>>(
      pid, `Condition?patient=Patient/${patientId}`, client,
    ),
    fetchFhirResource<FhirBundle<FhirMedicationRequest>>(
      pid, `MedicationRequest?patient=Patient/${patientId}`, client,
    ),
    fetchFhirResource<FhirBundle<FhirAllergyIntolerance>>(
      pid, `AllergyIntolerance?patient=Patient/${patientId}`, client,
    ),
    fetchFhirResource<FhirBundle<FhirObservation>>(
      pid,
      `Observation?patient=Patient/${patientId}&category=laboratory&date=ge${dateFilter}&_sort=-date&_count=20`,
      client,
    ),
    fetchFhirResource<FhirBundle<FhirObservation>>(
      pid,
      `Observation?patient=Patient/${patientId}&category=vital-signs&_sort=-date&_count=10`,
      client,
    ),
    fetchFhirResource<FhirBundle<FhirEncounter>>(
      pid, `Encounter?patient=Patient/${patientId}&_sort=-date&_count=10`, client,
    ),
    fetchFhirResource<FhirBundle<FhirProcedure>>(
      pid, `Procedure?patient=Patient/${patientId}&_sort=-date&_count=20`, client,
    ),
    fetchFhirResource<FhirBundle<FhirImmunization>>(
      pid, `Immunization?patient=Patient/${patientId}&_sort=-date&_count=10`, client,
    ),
  ]);

  // Patient resource is required
  if (patientResult.status === 'rejected') {
    throw new Error(`Failed to fetch patient data: ${patientResult.reason}`);
  }
  const fhirPatient = patientResult.value;

  // Extract bundles with warnings for failures
  const conditions =
    conditionsResult.status === 'fulfilled'
      ? extractBundle(conditionsResult.value)
      : (warnings.push('Condition data unavailable'), []);
  const meds =
    medsResult.status === 'fulfilled'
      ? extractBundle(medsResult.value)
      : (warnings.push('Medication data unavailable'), []);
  const allergies =
    allergiesResult.status === 'fulfilled'
      ? extractBundle(allergiesResult.value)
      : (warnings.push('Allergy data unavailable'), []);
  const labs =
    labsResult.status === 'fulfilled'
      ? extractBundle(labsResult.value)
      : (warnings.push('Lab data unavailable'), []);
  const vitals =
    vitalsResult.status === 'fulfilled'
      ? extractBundle(vitalsResult.value)
      : (warnings.push('Vital signs unavailable'), []);
  const encounters =
    encountersResult.status === 'fulfilled'
      ? extractBundle(encountersResult.value)
      : (warnings.push('Encounter history unavailable'), []);
  const procedures =
    proceduresResult.status === 'fulfilled'
      ? extractBundle(proceduresResult.value)
      : (warnings.push('Procedure data unavailable'), []);
  const immunizations =
    immunizationsResult.status === 'fulfilled'
      ? extractBundle(immunizationsResult.value)
      : (warnings.push('Immunization data unavailable'), []);

  // Enrich recent encounters (up to 5) with ClinicalImpressions and linked Conditions
  const recentEncounters = encounters.slice(0, 5);
  const encounterDetails = await Promise.all(
    recentEncounters.map(async (enc) => {
      const [impressions, linkedConditions] = await Promise.all([
        fetchClinicalImpressions(pid, enc.id, client),
        fetchConditions(
          pid,
          (enc.diagnosis ?? [])
            .map((d) => d.condition?.reference)
            .filter((r): r is string => !!r),
          client,
        ),
      ]);
      return { enc, impressions, linkedConditions };
    }),
  );

  const enrichedEncounters = encounterDetails.map(({ enc, impressions, linkedConditions }) =>
    mapEncounterSummary(enc, impressions, linkedConditions),
  );
  // Append remaining encounters without enrichment
  const remainingEncounters = encounters.slice(5).map((enc) => mapEncounterSummary(enc, [], []));

  const patient: MockPatient = {
    demographics: {
      name: patientDisplayName(fhirPatient),
      age: fhirPatient.birthDate ? calcAge(fhirPatient.birthDate) : 0,
      sex: mapGender(fhirPatient.gender),
      birthDate: fhirPatient.birthDate ?? '',
    },
    conditions: conditions.map(mapFhirCondition),
    medications: meds.map(mapMedicationRequest),
    allergies: allergies.map(mapAllergyIntolerance),
    recentLabs: labs.map(mapObservation),
    recentVitals: vitals.map(mapVital),
    procedures: procedures.map(mapProcedure),
    immunizations: immunizations.map(mapImmunization),
    pastEncounters: [...enrichedEncounters, ...remainingEncounters],
  };

  return { patient, warnings };
}
