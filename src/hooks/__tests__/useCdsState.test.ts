import { describe, it, expect } from 'vitest';

/**
 * We can't call React hooks directly in unit tests without a renderer,
 * so we test the reducer function directly. We need to export it first —
 * that's part of the refactor.
 */
import { cdsReducer, cdsInitialState } from '../useCdsState';

describe('cdsReducer — after context simplification', () => {
  it('should not have isLoadingPatient in initial state', () => {
    expect(cdsInitialState).not.toHaveProperty('isLoadingPatient');
  });

  it('should not have patientContext in initial state', () => {
    expect(cdsInitialState).not.toHaveProperty('patientContext');
  });

  it('should start in idle phase', () => {
    expect(cdsInitialState.phase).toBe('idle');
  });

  it('should transition to chatting on ADD_USER_MESSAGE', () => {
    const state = cdsReducer(cdsInitialState, {
      type: 'ADD_USER_MESSAGE',
      id: 'msg-1',
      content: 'What labs should I order?',
    });
    expect(state.phase).toBe('chatting');
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe('What labs should I order?');
  });

  it('should store agentContext on first user message when provided', () => {
    const context = 'Patient/abc-123\nCustom prompt: Focus on cardiology';
    const state = cdsReducer(cdsInitialState, {
      type: 'ADD_USER_MESSAGE',
      id: 'msg-1',
      content: 'Prepare for appointment',
      agentContext: context,
    });
    expect(state.messages[0].agentContext).toBe(context);
  });

  it('should not accept START_LOADING_PATIENT action', () => {
    // This action type should no longer exist in the union
    const state = cdsReducer(cdsInitialState, {
      type: 'START_LOADING_PATIENT' as any,
    });
    // Falls through to default — state unchanged
    expect(state).toEqual(cdsInitialState);
  });

  it('should not accept SET_PATIENT_CONTEXT action', () => {
    const state = cdsReducer(cdsInitialState, {
      type: 'SET_PATIENT_CONTEXT',
    } as any);
    expect(state).toEqual(cdsInitialState);
  });

  it('should not accept CLEAR_PATIENT_CONTEXT action', () => {
    const state = cdsReducer(cdsInitialState, {
      type: 'CLEAR_PATIENT_CONTEXT' as any,
    });
    expect(state).toEqual(cdsInitialState);
  });

  it('should preserve selectedAgent on NEW_CONVERSATION', () => {
    const agent = { id: 'a1', name: 'Test Agent' };
    let state = cdsReducer(cdsInitialState, { type: 'SELECT_AGENT', agent });
    state = cdsReducer(state, {
      type: 'ADD_USER_MESSAGE',
      id: 'msg-1',
      content: 'hello',
    });
    state = cdsReducer(state, { type: 'NEW_CONVERSATION' });
    expect(state.selectedAgent).toEqual(agent);
    expect(state.messages).toHaveLength(0);
    expect(state.phase).toBe('idle');
  });
});
