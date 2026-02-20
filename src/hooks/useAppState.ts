import { useReducer } from 'react';
import type {
  AppState,
  Encounter,
  ExtractedCode,
  CodeReview,
  SubmissionResult,
  ReviewDecision,
} from '../types';

interface State {
  state: AppState;
  encounter: Encounter | null;
  codes: ExtractedCode[];
  reviews: Map<string, CodeReview>;
  submission: SubmissionResult | null;
  error: string | null;
}

type Action =
  | { type: 'LOAD_ENCOUNTER'; encounter: Encounter }
  | { type: 'CODES_EXTRACTED'; codes: ExtractedCode[] }
  | {
      type: 'REVIEW_CODE';
      codeId: string;
      decision: ReviewDecision;
      comment?: string;
    }
  | { type: 'SUBMIT' }
  | { type: 'SUBMISSION_COMPLETE'; result: SubmissionResult }
  | { type: 'SUBMISSION_FAILED'; error: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };

const initialState: State = {
  state: 'idle',
  encounter: null,
  codes: [],
  reviews: new Map(),
  submission: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_ENCOUNTER':
      return {
        ...state,
        state: 'loading',
        encounter: action.encounter,
        codes: [],
        reviews: new Map(),
        submission: null,
      };

    case 'CODES_EXTRACTED':
      return {
        ...state,
        state: 'review',
        codes: action.codes,
      };

    case 'REVIEW_CODE': {
      const reviews = new Map(state.reviews);
      reviews.set(action.codeId, {
        codeId: action.codeId,
        decision: action.decision,
        comment: action.comment,
        reviewedAt: new Date().toISOString(),
      });
      return { ...state, reviews };
    }

    case 'SUBMIT':
      return { ...state, state: 'submitting' };

    case 'SUBMISSION_COMPLETE':
      return {
        ...state,
        state: 'submitted',
        submission: action.result,
        error: null,
      };

    case 'SUBMISSION_FAILED':
      return {
        ...state,
        state: 'review',
        error: action.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        state: 'error',
        error: action.error,
      };

    case 'RESET':
      return {
        state: 'idle',
        encounter: null,
        codes: [],
        reviews: new Map(),
        submission: null,
        error: null,
      };

    default:
      return state;
  }
}

export function useAppState() {
  return useReducer(reducer, initialState);
}

export type { State, Action };
