export interface Citation {
  text: string;
  begin_offset: number;
  end_offset: number;
}

export type CodeSystem =
  | 'ICD-10-CM'
  | 'ICD-10-PCS'
  | 'RXNORM'
  | 'LOINC'
  | 'HPO'
  | 'CPT'
  | 'SNOMED_CT_US_LITE';

export interface ExtractedCode {
  id: string;
  code: string;
  system: CodeSystem;
  description: string;
  reason: string;
  valid: boolean;
  citations: Citation[];
}

export interface Encounter {
  id: string;
  patient: {
    name: string;
    age: number;
    sex: 'M' | 'F' | 'O';
  };
  date: string;
  type: string;
  narrative: string;
  existingCodes: string[];               // codes already linked to this encounter
  problemListCodes: Record<string, string>; // code → Condition ID for all patient conditions
}

export type ReviewDecision = 'pending' | 'accepted' | 'rejected';

export interface CodeReview {
  codeId: string;
  decision: ReviewDecision;
  comment?: string;
  reviewedAt?: string;
}

export interface SubmissionResult {
  encounterRef: string;
  submittedAt: string;
  accepted: ExtractedCode[];
  rejected: Array<{ code: ExtractedCode; comment?: string }>;
  mode: 'demo' | 'ehr';   // Persisted at submission time; drives SubmissionSummary banners
  notice?: string;         // User-facing message for partial EHR write failures
}

export type AppState = 'idle' | 'loading' | 'review' | 'submitting' | 'submitted' | 'error';

export interface AppContext {
  state: AppState;
  encounter: Encounter | null;
  codes: ExtractedCode[];
  reviews: Map<string, CodeReview>;
  submission: SubmissionResult | null;
  error: string | null;
}
