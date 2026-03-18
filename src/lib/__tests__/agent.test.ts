import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSessionTraces, fetchAllChatMessages } from '../agent';

// Mock config module
vi.mock('../config', () => ({
  getConfig: vi.fn(),
  createClient: vi.fn(),
}));

import { getConfig, createClient } from '../config';

const mockGetConfig = vi.mocked(getConfig);
const mockCreateClient = vi.mocked(createClient);

function makeMockClient(messages: unknown[]) {
  return {
    agent: {
      getChatMessages: vi.fn().mockResolvedValue({
        messages,
        total: messages.length,
      }),
    },
  } as unknown as ReturnType<typeof createClient>;
}

describe('fetchSessionTraces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue({
      instanceUrl: 'https://test.pheno.ml',
      clientId: 'id',
      clientSecret: 'secret',
      fhirProviderId: 'provider',
      codeSystems: ['ICD-10-CM'],
    });
  });

  it('throws when config is null', async () => {
    mockGetConfig.mockResolvedValue(null);
    await expect(fetchSessionTraces('session-1')).rejects.toThrow(
      'PhenoML credentials not configured.',
    );
  });

  it('returns empty traces when no messages', async () => {
    const client = makeMockClient([]);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchSessionTraces('session-1');
    expect(result.tracesByOrder.size).toBe(0);
    expect(result.total).toBe(0);
  });

  it('pairs model+function messages into ToolCall for an assistant', async () => {
    const messages = [
      { role: 'user', message_order: 0, content: 'hello' },
      {
        role: 'model',
        message_order: 1,
        function_name: 'search_fhir',
        function_args: { query: 'patient' },
      },
      {
        role: 'function',
        message_order: 2,
        function_name: 'search_fhir',
        function_result: { count: 5 },
      },
      { role: 'assistant', message_order: 3, content: 'Found 5 records' },
    ];

    const client = makeMockClient(messages);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchSessionTraces('session-1');
    expect(result.tracesByOrder.size).toBe(1);

    const calls = result.tracesByOrder.get(3);
    expect(calls).toHaveLength(1);
    expect(calls![0]).toEqual({
      name: 'search_fhir',
      args: { query: 'patient' },
      result: { count: 5 },
    });
  });

  it('handles unpaired model message (no matching function)', async () => {
    const messages = [
      {
        role: 'model',
        message_order: 0,
        function_name: 'get_data',
        function_args: { id: '1' },
      },
      { role: 'assistant', message_order: 1, content: 'response' },
    ];

    const client = makeMockClient(messages);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchSessionTraces('session-1');
    const calls = result.tracesByOrder.get(1);
    expect(calls).toHaveLength(1);
    expect(calls![0].result).toEqual({});
  });

  it('partitions tool calls across multiple assistant messages', async () => {
    const messages = [
      { role: 'user', message_order: 0, content: 'q1' },
      {
        role: 'model',
        message_order: 1,
        function_name: 'tool_a',
        function_args: {},
      },
      {
        role: 'function',
        message_order: 2,
        function_name: 'tool_a',
        function_result: { a: 1 },
      },
      { role: 'assistant', message_order: 3, content: 'answer 1' },
      { role: 'user', message_order: 4, content: 'q2' },
      {
        role: 'model',
        message_order: 5,
        function_name: 'tool_b',
        function_args: {},
      },
      {
        role: 'function',
        message_order: 6,
        function_name: 'tool_b',
        function_result: { b: 2 },
      },
      {
        role: 'model',
        message_order: 7,
        function_name: 'tool_c',
        function_args: {},
      },
      {
        role: 'function',
        message_order: 8,
        function_name: 'tool_c',
        function_result: { c: 3 },
      },
      { role: 'assistant', message_order: 9, content: 'answer 2' },
    ];

    const client = makeMockClient(messages);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchSessionTraces('session-1');

    const calls1 = result.tracesByOrder.get(3);
    expect(calls1).toHaveLength(1);
    expect(calls1![0].name).toBe('tool_a');

    const calls2 = result.tracesByOrder.get(9);
    expect(calls2).toHaveLength(2);
    expect(calls2![0].name).toBe('tool_b');
    expect(calls2![1].name).toBe('tool_c');
  });

  it('handles assistant message with no preceding tool calls', async () => {
    const messages = [
      { role: 'user', message_order: 0, content: 'hi' },
      { role: 'assistant', message_order: 1, content: 'hello!' },
    ];

    const client = makeMockClient(messages);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchSessionTraces('session-1');
    const calls = result.tracesByOrder.get(1);
    expect(calls).toEqual([]);
  });
});

describe('fetchAllChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue({
      instanceUrl: 'https://test.pheno.ml',
      clientId: 'id',
      clientSecret: 'secret',
      fhirProviderId: 'provider',
      codeSystems: ['ICD-10-CM'],
    });
  });

  it('throws when config is null', async () => {
    mockGetConfig.mockResolvedValue(null);
    await expect(fetchAllChatMessages({ sessionId: 's1' })).rejects.toThrow(
      'PhenoML credentials not configured.',
    );
  });

  it('maps SDK messages to ChatMessageEntry objects', async () => {
    const sdkMessages = [
      {
        id: 'm1',
        role: 'user',
        content: 'hello',
        message_order: 0,
        created: '2026-01-01T00:00:00Z',
      },
      {
        id: 'm2',
        role: 'model',
        function_name: 'search',
        function_args: { q: 'test' },
        message_order: 1,
      },
      {
        id: 'm3',
        role: 'function',
        function_name: 'search',
        function_result: { results: [] },
        message_order: 2,
      },
      {
        id: 'm4',
        role: 'assistant',
        content: 'Found nothing',
        message_order: 3,
        created: '2026-01-01T00:00:01Z',
      },
    ];

    const client = makeMockClient(sdkMessages);
    mockCreateClient.mockReturnValue(client);

    const result = await fetchAllChatMessages({ sessionId: 's1' });

    expect(result.messages).toHaveLength(4);
    expect(result.total).toBe(4);

    expect(result.messages[0]).toEqual({
      id: 'm1',
      role: 'user',
      content: 'hello',
      functionName: undefined,
      functionArgs: undefined,
      functionResult: undefined,
      messageOrder: 0,
      created: '2026-01-01T00:00:00Z',
    });

    expect(result.messages[1].functionName).toBe('search');
    expect(result.messages[1].functionArgs).toEqual({ q: 'test' });
  });

  it('passes numMessages to SDK when provided', async () => {
    const client = makeMockClient([]);
    mockCreateClient.mockReturnValue(client);

    await fetchAllChatMessages({ sessionId: 's1', numMessages: 20 });

    expect(client.agent.getChatMessages).toHaveBeenCalledWith(
      expect.objectContaining({ num_messages: 20 }),
    );
  });
});
