const ENCOUNTER_URL_RE =
  /\/Patient\/(?<patientId>[a-f0-9-]+)\/Encounter\/(?<encounterId>[a-f0-9-]+)/i;
const MEDPLUM_RE = /^https?:\/\/[^/]*\.medplum\.com\//;

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

export default defineBackground(() => {
  // Open side panel on icon click
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => console.error('sidePanel error:', error));

  // Handle screenshot capture requests from the side panel
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'CAPTURE_TAB') {
      browser.tabs.captureVisibleTab({ format: 'png' }).then(
        (dataUrl: string) => sendResponse({ dataUrl }),
        (err: unknown) => sendResponse({ error: String(err) }),
      );
      return true; // async response
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
