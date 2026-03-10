export interface BuildCdsMessageOptions {
  text: string;
  isFirstMessage: boolean;
  patientId?: string;
  customPrompt?: string;
}

export function buildCdsMessage(options: BuildCdsMessageOptions): string {
  const { text, isFirstMessage, patientId, customPrompt } = options;

  if (!isFirstMessage) return text;

  const parts: string[] = [];

  if (patientId) {
    parts.push(`Patient ID: ${patientId}`);
  }

  if (customPrompt) {
    parts.push(`Additional instructions: ${customPrompt}`);
  }

  parts.push(text);

  return parts.join('\n\n');
}

export function buildAgentContext(patientId: string, customPrompt?: string): string {
  const lines: string[] = [
    `Patient/` + patientId,
  ];

  if (customPrompt) {
    lines.push(`Custom prompt: ${customPrompt}`);
  }

  lines.push('Agent has direct FHIR access via configured provider');

  return lines.join('\n');
}
