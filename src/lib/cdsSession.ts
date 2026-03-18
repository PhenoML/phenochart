import type { CdsSession } from '../types/cds';
import type { ChatMessage } from '../types/chat';

const SESSION_KEY_PREFIX = 'cds_session_';
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sessionKey(patientId: string): string {
  return `${SESSION_KEY_PREFIX}${patientId}`;
}

export async function loadCdsSession(patientId: string): Promise<CdsSession | null> {
  const key = sessionKey(patientId);
  const result = await browser.storage.local.get(key);
  const session = result[key] as CdsSession | undefined;
  if (!session) return null;

  const elapsed = Date.now() - new Date(session.lastUpdated).getTime();
  if (elapsed > SESSION_EXPIRY_MS) {
    await browser.storage.local.remove(key);
    return null;
  }

  return session;
}

export async function saveCdsSession(
  patientId: string,
  sessionId: string | null,
  messages: ChatMessage[],
): Promise<void> {
  const key = sessionKey(patientId);
  const session: CdsSession = {
    sessionId,
    messages: messages.filter((m) => !m.isStreaming),
    lastUpdated: new Date().toISOString(),
  };
  await browser.storage.local.set({ [key]: session });
}

export async function clearCdsSession(patientId: string): Promise<void> {
  await browser.storage.local.remove(sessionKey(patientId));
}
