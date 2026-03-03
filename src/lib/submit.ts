import type { phenoml } from 'phenoml';
import type { ExtractedCode, CodeReview, SubmissionResult, CodeSystem } from '../types';
import { getConfig, createClient } from './config';

const SYSTEM_URI: Record<CodeSystem, string> = {
  'ICD-10-CM':         'http://hl7.org/fhir/sid/icd-10-cm',
  'ICD-10-PCS':        'http://www.cms.gov/Medicare/Coding/ICD10',
  'RXNORM':            'http://www.nlm.nih.gov/research/umls/rxnorm',
  'LOINC':             'http://loinc.org',
  'HPO':               'http://www.human-phenotype-ontology.org',
  'CPT':               'http://www.ama-assn.org/go/cpt',
  'SNOMED_CT_US_LITE': 'http://snomed.info/sct',
};

function buildBundleEntry(
  code: ExtractedCode,
  patientRef: string,
  encounterRef: string,
): phenoml.fhir.FhirBundle.Entry.Item {
  const system = SYSTEM_URI[code.system];
  const coding = [{ system, code: code.code, display: code.description }];
  const codeableConcept = { coding, text: code.description };
  const subject = { reference: patientRef };
  const encounter = { reference: encounterRef };

  switch (code.system) {
    case 'RXNORM':
      return {
        request: { method: 'POST', url: 'MedicationRequest' },
        resource: {
          resourceType: 'MedicationRequest',
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: codeableConcept,
          subject,
          encounter,
        },
      };

    case 'LOINC':
      return {
        request: { method: 'POST', url: 'Observation' },
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: codeableConcept,
          subject,
          encounter,
        },
      };

    case 'ICD-10-PCS':
    case 'CPT':
      return {
        request: { method: 'POST', url: 'Procedure' },
        resource: {
          resourceType: 'Procedure',
          status: 'completed',
          code: codeableConcept,
          subject,
          encounter,
        },
      };

    case 'HPO':
      return {
        request: { method: 'POST', url: 'Condition' },
        resource: {
          resourceType: 'Condition',
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
          },
          category: [{
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }],
          }],
          code: codeableConcept,
          subject,
          encounter,
        },
      };

    // ICD-10-CM and SNOMED_CT_US_LITE → encounter-diagnosis Condition
    case 'ICD-10-CM':
    case 'SNOMED_CT_US_LITE':
    default:
      return {
        request: { method: 'POST', url: 'Condition' },
        resource: {
          resourceType: 'Condition',
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
          },
          verificationStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }],
          },
          category: [{
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' }],
          }],
          code: codeableConcept,
          subject,
          encounter,
        },
      };
  }
}

// Only ICD-10-CM and SNOMED_CT_US_LITE use category=encounter-diagnosis;
// HPO (problem-list), RXNORM, LOINC, and Procedures live elsewhere.
const ENCOUNTER_DIAGNOSIS_SYSTEMS = new Set<CodeSystem>(['ICD-10-CM', 'SNOMED_CT_US_LITE']);

function diagnosisEntry(conditionRef: string) {
  return {
    condition: { reference: conditionRef },
    use: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role', code: 'billing' }],
    },
  };
}

export async function submitToEhr(
  codes: ExtractedCode[],
  reviews: Map<string, CodeReview>,
  patientId: string,
  encounterId: string,
  existingCodes: string[] = [],
  problemListCodes: Record<string, string> = {},
): Promise<SubmissionResult> {
  const config = await getConfig();
  if (!config) throw new Error('PhenoML credentials not configured.');
  const client = createClient(config);

  const existingCodeSet = new Set(existingCodes);
  const accepted = codes.filter(
    (c) => reviews.get(c.id)?.decision === 'accepted' && !existingCodeSet.has(c.code),
  );
  const rejected = codes
    .filter((c) => reviews.get(c.id)?.decision === 'rejected')
    .map((c) => ({ code: c, comment: reviews.get(c.id)?.comment }));

  const encounterRef = `Encounter/${encounterId}`;

  if (accepted.length === 0) {
    return {
      encounterRef,
      submittedAt: new Date().toISOString(),
      accepted: [],
      rejected,
      mode: 'ehr',
    };
  }

  const patientRef = `Patient/${patientId}`;

  // Split accepted codes:
  // - existingDiagnosis: encounter-diagnosis system + already on patient's problem list
  //   → link existing Condition, skip creation
  // - toCreate: everything else → create via bundle
  const existingDiagnosis = accepted.filter(
    (c) => ENCOUNTER_DIAGNOSIS_SYSTEMS.has(c.system) && problemListCodes[c.code],
  );
  const toCreate = accepted.filter(
    (c) => !(ENCOUNTER_DIAGNOSIS_SYSTEMS.has(c.system) && problemListCodes[c.code]),
  );

  let bundleResponse: { entry?: Array<{ response?: { location?: string } }> } = {};
  if (toCreate.length > 0) {
    const entry = toCreate.map((code) => buildBundleEntry(code, patientRef, encounterRef));
    // FhirBundle SDK type omits `type`; cast required for FHIR transaction semantics
    const bundle = { resourceType: 'Bundle', type: 'transaction', entry } as unknown as phenoml.fhir.FhirBundle;
    bundleResponse = await client.fhir.executeBundle(config.fhirProviderId, { body: bundle });
  }

  // Build new encounter.diagnosis entries from both sources
  const newDiagnoses: ReturnType<typeof diagnosisEntry>[] = [];

  // From newly-created resources (bundle response)
  toCreate.forEach((code, i) => {
    if (!ENCOUNTER_DIAGNOSIS_SYSTEMS.has(code.system)) return;
    const location = bundleResponse.entry?.[i]?.response?.location;
    if (!location) return;
    // Location format: "Condition/abc123/_history/1" → strip history suffix
    newDiagnoses.push(diagnosisEntry(location.split('/_history')[0]));
  });

  // From existing Condition resources on the patient's problem list
  existingDiagnosis.forEach((code) => {
    newDiagnoses.push(diagnosisEntry(`Condition/${problemListCodes[code.code]}`));
  });

  if (newDiagnoses.length > 0) {
    // Medplum does not support the RFC 6902 '-' append token when the diagnosis
    // array is absent. GET the encounter to check the current length and use
    // exact indices instead — or create the array if it doesn't exist yet.
    const currentEnc = await client.fhir.search(
      config.fhirProviderId,
      `Encounter/${encounterId}`,
    ) as { diagnosis?: unknown[] };
    const existingCount = currentEnc.diagnosis?.length ?? 0;

    const patchOps =
      existingCount === 0
        ? [{ op: 'add' as const, path: '/diagnosis', value: newDiagnoses }]
        : newDiagnoses.map((d, i) => ({
            op: 'add' as const,
            path: `/diagnosis/${existingCount + i}`,
            value: d,
          }));

    await client.fhir.patch(config.fhirProviderId, `Encounter/${encounterId}`, {
      body: patchOps,
    });
  }

  return {
    encounterRef,
    submittedAt: new Date().toISOString(),
    accepted,
    rejected,
    mode: 'ehr',
  };
}
