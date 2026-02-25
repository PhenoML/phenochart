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
