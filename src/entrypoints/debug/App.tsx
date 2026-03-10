import { useState, useEffect, useCallback } from 'react';
import { fetchAllChatMessages, type ChatMessageEntry } from '../../lib/agent';

const PAGE_SIZE = 20;

export function DebugApp() {
  const params = new URLSearchParams(window.location.search);
  const initialSessionId = params.get('sessionId') ?? '';

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionInput, setSessionInput] = useState(initialSessionId);
  const [messages, setMessages] = useState<ChatMessageEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages = useCallback(async (sid: string, pageNum: number, prevCount: number) => {
    if (!sid) return;
    setLoading(true);
    setError(null);
    try {
      const { messages: msgs, total: t } = await fetchAllChatMessages({
        sessionId: sid,
        numMessages: pageNum * PAGE_SIZE,
      });
      setHasMore(msgs.length > prevCount || pageNum === 1);
      setMessages(msgs);
      setTotal(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) loadMessages(sessionId, page, messages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, page]);

  const handleSessionSwitch = () => {
    setSessionId(sessionInput);
    setPage(1);
    setMessages([]);
    setHasMore(true);
  };

  const roleColor: Record<string, string> = {
    user: 'text-pheno-accent',
    assistant: 'text-pheno-approve',
    model: 'text-pheno-text-secondary',
    function: 'text-pheno-text-tertiary',
  };

  return (
    <div className="min-h-screen bg-pheno-bg-base p-4 font-mono text-sm text-pheno-text-primary">
      <h1 className="mb-4 font-body text-lg font-semibold">Agent Debug Timeline</h1>

      {/* Session picker */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
          placeholder="Session ID"
          className="flex-1 rounded border border-pheno-border bg-pheno-bg px-2 py-1 text-sm"
        />
        <button
          onClick={handleSessionSwitch}
          className="rounded bg-pheno-accent px-3 py-1 text-sm text-white hover:bg-pheno-accent/80"
        >
          Load
        </button>
        <button
          onClick={() => loadMessages(sessionId, page, messages.length)}
          disabled={loading}
          className="rounded border border-pheno-border px-3 py-1 text-sm hover:bg-pheno-bg-panel disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-pheno-reject">{error}</p>}
      {loading && <p className="mb-4 text-pheno-text-tertiary">Loading...</p>}

      {/* Message timeline */}
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded border border-pheno-border bg-pheno-bg-panel p-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-bold ${roleColor[msg.role] ?? ''}`}>
                {msg.role}
              </span>
              {msg.functionName && (
                <span className="text-pheno-text-tertiary">{msg.functionName}</span>
              )}
              {msg.created && (
                <span className="ml-auto text-pheno-text-tertiary">
                  {new Date(msg.created).toLocaleTimeString()}
                </span>
              )}
            </div>
            {msg.content && (
              <pre className="mt-1 whitespace-pre-wrap text-xs">{msg.content}</pre>
            )}
            {msg.functionArgs && (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-pheno-text-tertiary">args</summary>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {JSON.stringify(msg.functionArgs, null, 2)}
                </pre>
              </details>
            )}
            {msg.functionResult && (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-pheno-text-tertiary">result</summary>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {JSON.stringify(msg.functionResult, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {hasMore && total > messages.length && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="mt-4 w-full rounded border border-pheno-border py-2 text-sm hover:bg-pheno-bg-panel disabled:opacity-40"
        >
          Load more ({messages.length} / {total})
        </button>
      )}
    </div>
  );
}
