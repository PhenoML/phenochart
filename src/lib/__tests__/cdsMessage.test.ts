import { describe, it, expect } from 'vitest';
import { buildCdsMessage, buildAgentContext } from '../cdsMessage';
import { CDS_APPOINTMENT_PREP_PROMPT } from '../cdsPrompt';

describe('buildAgentContext', () => {
  it('should include patient ID', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).toContain('Patient/abc-123');
  });

  it('should indicate agent has direct FHIR access', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).toMatch(/FHIR/i);
  });

  it('should not include custom prompt references', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).not.toContain('Custom prompt');
  });
});

describe('buildCdsMessage', () => {
  it('should include system prompt, [CONTEXT] block, and user text on first message', () => {
    const result = buildCdsMessage({
      text: 'What about medications?',
      patientId: 'abc-123',
      isFirstMessage: true,
    });
    expect(result).toContain(CDS_APPOINTMENT_PREP_PROMPT);
    expect(result).toContain('[CONTEXT]');
    expect(result).toContain('Patient ID: Patient/abc-123');
    expect(result).toContain('lang2fhir_and_search');
    expect(result).toContain('[/CONTEXT]');
    expect(result).toContain('What about medications?');
  });

  it('should include [CONTEXT] block but NOT system prompt on follow-up messages', () => {
    const result = buildCdsMessage({
      text: 'Follow-up question',
      patientId: 'abc-123',
      isFirstMessage: false,
    });
    expect(result).not.toContain(CDS_APPOINTMENT_PREP_PROMPT);
    expect(result).toContain('[CONTEXT]');
    expect(result).toContain('Patient ID: Patient/abc-123');
    expect(result).toContain('Follow-up question');
  });

  it('should default isFirstMessage to false', () => {
    const result = buildCdsMessage({
      text: 'Follow-up question',
      patientId: 'abc-123',
    });
    expect(result).not.toContain(CDS_APPOINTMENT_PREP_PROMPT);
    expect(result).toContain('[CONTEXT]');
  });

  it('should include resource-specific search instructions', () => {
    const result = buildCdsMessage({
      text: 'Any drug interactions?',
      patientId: 'abc-123',
    });
    expect(result).toContain('MedicationRequest');
    expect(result).toContain('Condition');
    expect(result).toContain('Observation');
    expect(result).toContain('AllergyIntolerance');
    expect(result).toContain('Encounter');
  });

  it('should return plain text when no patientId', () => {
    const result = buildCdsMessage({
      text: 'What labs should I order?',
    });
    expect(result).toBe('What labs should I order?');
  });
});
