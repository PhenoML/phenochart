import type { BackgroundTask, ChatMessage } from '../types/chat';
import { extractFhirResources, sendAgentChat } from '../lib/agent';

const ENCOUNTER_URL_RE =
  /\/Patient\/(?<patientId>[a-f0-9-]+)\/Encounter\/(?<encounterId>[a-f0-9-]+)/i;
const MEDPLUM_RE = /^https?:\/\/[^/]*\.medplum\.com\//;

const STORAGE_KEY = 'phenochart_tasks';
const MAX_TASKS = 10;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

async function getTasks(): Promise<BackgroundTask[]> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as BackgroundTask[] | undefined) ?? [];
}

async function saveTasks(tasks: BackgroundTask[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: tasks });
}

async function addTask(task: BackgroundTask): Promise<void> {
  const tasks = await getTasks();
  tasks.unshift(task);
  // Prune old tasks to avoid hitting storage quota
  await saveTasks(tasks.slice(0, MAX_TASKS));
}

async function updateTask(
  taskId: string,
  patch: Partial<BackgroundTask>,
): Promise<void> {
  const tasks = await getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...patch };
    await saveTasks(tasks);
  }
}

async function removeTask(taskId: string): Promise<void> {
  const tasks = await getTasks();
  await saveTasks(tasks.filter((t) => t.id !== taskId));
}

// ---------------------------------------------------------------------------
// Pipeline orchestration
// ---------------------------------------------------------------------------

async function runPipeline(message: {
  agentId: string;
  agentName: string;
  userPrompt: string;
  screenshotBase64: string;
  screenshotDataUrl: string;
  patientId?: string;
  sourceUrl?: string;
}): Promise<void> {
  const taskId = `task-${Date.now()}`;

  const task: BackgroundTask = {
    id: taskId,
    status: 'extracting_fhir',
    agentId: message.agentId,
    agentName: message.agentName,
    userPrompt: message.userPrompt,
    sourceUrl: message.sourceUrl ?? '',
    screenshotDataUrl: message.screenshotDataUrl,
    screenshotBase64: message.screenshotBase64,
    fhirBundle: null,
    messages: [],
    sessionId: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  await addTask(task);

  try {
    // Step 1: Extract FHIR resources from the screenshot
    const bundle = await extractFhirResources(message.screenshotBase64);
    await updateTask(taskId, { fhirBundle: bundle, status: 'chatting' });

    // Step 2: Send FHIR bundle + user prompt to the agent
    const fhirJsonStr = JSON.stringify(bundle, null, 2);
    const fullMessageForAgent = `Here is the FHIR Bundle extracted from the patient's chart:\n\n\`\`\`json\n${fhirJsonStr}\n\`\`\`\n\n${message.userPrompt}`;

    const userMsg: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      role: 'user',
      content: message.userPrompt,
      fhirJson: fhirJsonStr,
      timestamp: new Date().toISOString(),
    };

    const { content, sessionId } = await sendAgentChat({
      agentId: message.agentId,
      message: fullMessageForAgent,
      patientId: message.patientId,
    });

    const assistantMsg: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };

    await updateTask(taskId, {
      status: 'completed',
      messages: [userMsg, assistantMsg],
      sessionId,
      completedAt: new Date().toISOString(),
    });

    // Notify the user
    browser.notifications.create(`task-${taskId}`, {
      type: 'basic',
      iconUrl: 'icons/128.png',
      title: 'Draft Ready',
      message: `${message.agentName} has finished processing.`,
    });

    // Badge on the extension icon
    browser.action.setBadgeText({ text: '1' });
    browser.action.setBadgeBackgroundColor({ color: '#2D5A3D' });
  } catch (err) {
    await updateTask(taskId, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Pipeline failed.',
    });
  }
}

// ---------------------------------------------------------------------------
// Page context tracking
// ---------------------------------------------------------------------------

function updatePageContext(url: string | undefined) {
  if (!url) {
    browser.storage.local.set({
      pageContext: {
        url: '',
        isEncounterPage: false,
        isMedPlum: false,
        patientId: null,
        encounterId: null,
      },
    });
    return;
  }

  const isMedPlum = MEDPLUM_RE.test(url);
  const match = url.match(ENCOUNTER_URL_RE);

  browser.storage.local.set({
    pageContext: {
      url,
      isEncounterPage: match !== null,
      isMedPlum,
      patientId: match?.groups?.patientId ?? null,
      encounterId: match?.groups?.encounterId ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default defineBackground(() => {
  // Open side panel on icon click
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => console.error('sidePanel error:', error));

  // Handle messages from the side panel
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return;

    switch (message.type) {
      case 'CAPTURE_TAB':
        browser.tabs.captureVisibleTab({ format: 'png' }).then(
          (dataUrl: string) => sendResponse({ dataUrl }),
          (err: unknown) => sendResponse({ error: String(err) }),
        );
        return true; // async response

      case 'START_PIPELINE':
        // Keep the message channel open so the service worker stays alive
        // for the full pipeline duration. The side panel fire-and-forgets
        // this message (doesn't await the response).
        runPipeline(message).then(
          () => sendResponse({ ok: true }),
          (err: unknown) => {
            console.error('Pipeline failed:', err);
            sendResponse({ error: String(err) });
          },
        );
        return true;

      case 'OPEN_TASK':
        // Clear badge when user views a completed task
        browser.action.setBadgeText({ text: '' });
        sendResponse({ ok: true });
        break;

      case 'DISMISS_TASK':
        removeTask(message.taskId).then(
          () => sendResponse({ ok: true }),
          (err: unknown) => sendResponse({ error: String(err) }),
        );
        return true;
    }
  });

  // Track URL when the user switches tabs
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const tab = await browser.tabs.get(tabId);
      updatePageContext(tab.url);
    } catch {
      // Tab may have been closed
    }
  });

  // Track URL when a tab navigates (full page load, not SPA)
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) return;
    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (activeTab?.id === tabId) {
        updatePageContext(changeInfo.url);
      }
    } catch {
      // Window may have been closed
    }
  });
});
