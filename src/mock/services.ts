import { mockEncounter } from './encounter';
import { mockCodes } from './codes';
import type {
  Encounter,
  ExtractedCode,
  SubmissionResult,
  CodeReview,
} from '../types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simulate FHIR read — returns encounter after 150ms
export async function fetchEncounter(): Promise<Encounter> {
  await delay(150);
  return mockEncounter;
}

// Simulate Construe extraction — returns codes after 300ms
// Total loading time: 150ms + 300ms = 450ms (under Design Doc's 500ms constraint)
export async function extractCodes(
  _narrative: string,
): Promise<ExtractedCode[]> {
  await delay(300);
  return mockCodes;
}

// Simulate FHIR write-back — returns result after 400ms
export async function submitCodes(
  encounterRef: string,
  reviews: Map<string, CodeReview>,
): Promise<SubmissionResult> {
  await delay(400);

  const accepted: ExtractedCode[] = [];
  const rejected: Array<{ code: ExtractedCode; comment?: string }> = [];

  for (const [codeId, review] of reviews) {
    const code = mockCodes.find((c) => c.id === codeId);
    if (!code) {
      console.warn(`submitCodes: review for unknown code ID "${codeId}" was skipped`);
      continue;
    }

    if (review.decision === 'accepted') {
      accepted.push(code);
    } else if (review.decision === 'rejected') {
      rejected.push({ code, comment: review.comment });
    }
  }

  return {
    encounterRef,
    submittedAt: new Date().toISOString(),
    accepted,
    rejected,
  };
}
