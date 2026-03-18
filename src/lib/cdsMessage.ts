import { CDS_APPOINTMENT_PREP_PROMPT } from './cdsPrompt';

export interface BuildCdsMessageOptions {
  text: string;
  patientId?: string;
  isFirstMessage?: boolean;
}

export function buildCdsMessage(options: BuildCdsMessageOptions): string {
  const { text, patientId, isFirstMessage = false } = options;

  if (!patientId) return text;

  const contextLines = [
    '[CONTEXT]',
    `Patient ID: Patient/${patientId}`,
    'Task: Appointment preparation',
    '',
    'INSTRUCTIONS FOR THIS MESSAGE:',
    '- You MUST call lang2fhir_and_search to fetch the relevant FHIR data BEFORE answering.',
    '- Do NOT assume data is unavailable based on previous messages — always search again.',
    '- If the question is about medications, search for MedicationRequest resources.',
    '- If the question is about conditions, search for Condition resources.',
    '- If the question is about labs, search for Observation resources.',
    '- If the question is about allergies, search for AllergyIntolerance resources.',
    '- If the question is about encounters/visits, search for Encounter resources.',
    '[/CONTEXT]',
  ];

  const contextBlock = contextLines.join('\n');

  if (isFirstMessage) {
    return `${CDS_APPOINTMENT_PREP_PROMPT}\n\n${contextBlock}\n\n${text}`;
  }

  return `${contextBlock}\n\n${text}`;
}

export function buildAgentContext(patientId: string): string {
  return [
    `Patient/${patientId}`,
    'Agent has direct FHIR access via configured provider',
  ].join('\n');
}
