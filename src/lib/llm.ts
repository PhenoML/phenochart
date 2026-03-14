export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  baseUrl: string;
  apiKey: string;
  apiKeyHeader?: string;
  model: string;
  messages: ChatCompletionMessage[];
}

export async function sendChatCompletion(options: ChatCompletionOptions): Promise<string> {
  const { baseUrl, apiKey, apiKeyHeader = 'Authorization', model, messages } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  headers[apiKeyHeader] = apiKeyHeader === 'Authorization' ? `Bearer ${apiKey}` : apiKey;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
