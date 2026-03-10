export interface BuildCdsMessageOptions {
  text: string;
  isFirstMessage: boolean;
  customPrompt?: string;
}

export function buildCdsMessage(options: BuildCdsMessageOptions): string {
  const { text, isFirstMessage, customPrompt } = options;

  if (isFirstMessage && customPrompt) {
    return `Additional instructions: ${customPrompt}\n\n---\n\nUser question: ${text}`;
  }

  return text;
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
