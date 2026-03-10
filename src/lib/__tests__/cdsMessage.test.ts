import { describe, it, expect } from 'vitest';
import { buildCdsMessage, buildAgentContext } from '../cdsMessage';

describe('buildAgentContext', () => {
  it('should include patient ID', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).toContain('Patient/abc-123');
  });

  it('should include custom prompt when provided', () => {
    const ctx = buildAgentContext('abc-123', 'Focus on cardiology follow-up');
    expect(ctx).toContain('Focus on cardiology follow-up');
  });

  it('should not include custom prompt line when not provided', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).not.toContain('Custom prompt');
  });

  it('should indicate agent has direct FHIR access', () => {
    const ctx = buildAgentContext('abc-123');
    expect(ctx).toMatch(/FHIR/i);
  });
});

describe('buildCdsMessage', () => {
  it('should include patient ID and custom prompt on first message', () => {
    const result = buildCdsMessage({
      text: 'What labs should I order?',
      isFirstMessage: true,
      patientId: 'abc-123',
      customPrompt: 'Focus on cardiology',
    });
    expect(result).toContain('Patient ID: abc-123');
    expect(result).toContain('Focus on cardiology');
    expect(result).toContain('What labs should I order?');
  });

  it('should include patient ID without custom prompt on first message', () => {
    const result = buildCdsMessage({
      text: 'What labs should I order?',
      isFirstMessage: true,
      patientId: 'abc-123',
    });
    expect(result).toContain('Patient ID: abc-123');
    expect(result).toContain('What labs should I order?');
    expect(result).not.toContain('Additional instructions');
  });

  it('should not prepend context on subsequent messages', () => {
    const result = buildCdsMessage({
      text: 'And what about medications?',
      isFirstMessage: false,
      patientId: 'abc-123',
      customPrompt: 'Focus on cardiology',
    });
    expect(result).not.toContain('Focus on cardiology');
    expect(result).not.toContain('Patient ID');
    expect(result).toBe('And what about medications?');
  });

  it('should return plain text when no patient ID or custom prompt on first message', () => {
    const result = buildCdsMessage({
      text: 'What labs should I order?',
      isFirstMessage: true,
    });
    expect(result).toBe('What labs should I order?');
  });
});
