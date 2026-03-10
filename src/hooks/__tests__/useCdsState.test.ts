import { describe, it, expect } from 'vitest';
import { cdsReducer, cdsInitialState } from '../useCdsState';
import type { TraceData } from '../../types/chat';

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

describe('cdsReducer SET_TRACES', () => {
  it('attaches trace data to matching assistant messages by id', () => {
    const state = {
      ...cdsInitialState,
      phase: 'chatting' as const,
      messages: [
        { id: 'u1', role: 'user' as const, content: 'hi', timestamp: '2026-01-01T00:00:00Z' },
        { id: 'a1', role: 'assistant' as const, content: 'hello', timestamp: '2026-01-01T00:00:01Z' },
        { id: 'u2', role: 'user' as const, content: 'q2', timestamp: '2026-01-01T00:00:02Z' },
        { id: 'a2', role: 'assistant' as const, content: 'answer', timestamp: '2026-01-01T00:00:03Z' },
      ],
    };

    const trace1: TraceData = { toolCalls: [{ name: 'tool_a', args: {}, result: {} }] };
    const trace2: TraceData = { toolCalls: [{ name: 'tool_b', args: {}, result: { b: 1 } }] };
    const traces = new Map<string, TraceData>([
      ['a1', trace1],
      ['a2', trace2],
    ]);

    const next = cdsReducer(state, { type: 'SET_TRACES', traces });

    expect(next.messages[0].trace).toBeUndefined();
    expect(next.messages[1].trace).toEqual(trace1);
    expect(next.messages[2].trace).toBeUndefined();
    expect(next.messages[3].trace).toEqual(trace2);
  });

  it('leaves messages without matching trace unchanged', () => {
    const state = {
      ...cdsInitialState,
      messages: [
        { id: 'a1', role: 'assistant' as const, content: 'hi', timestamp: '2026-01-01T00:00:00Z' },
      ],
    };

    const traces = new Map<string, TraceData>([
      ['nonexistent', { toolCalls: [] }],
    ]);

    const next = cdsReducer(state, { type: 'SET_TRACES', traces });
    expect(next.messages[0].trace).toBeUndefined();
  });
});
