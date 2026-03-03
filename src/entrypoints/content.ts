export default defineContentScript({
  matches: [
    'https://*.medplum.com/*',
  ],
  main() {
    // Guard against duplicate injection (HMR / extension update)
    if ((window as unknown as Record<string, unknown>).__phenochart_injected) return;
    (window as unknown as Record<string, unknown>).__phenochart_injected = true;

    const ENCOUNTER_URL_RE = /\/Patient\/(?<patientId>[a-f0-9-]+)\/Encounter\/(?<encounterId>[a-f0-9-]+)/i;

    const checkUrl = () => {
      const url = window.location.href;
      const match = url.match(ENCOUNTER_URL_RE);
      browser.storage.local.set({
        pageContext: {
          url,
          isEncounterPage: match !== null,
          isMedPlum: true,
          patientId: match?.groups?.patientId ?? null,
          encounterId: match?.groups?.encounterId ?? null,
        },
      }).catch(() => {
        // Extension context may be invalidated after update/reload
      });
    };

    // Initial check
    checkUrl();

    // SPA navigation detection via history API interception
    window.addEventListener('popstate', checkUrl);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args);
      try { checkUrl(); } catch { /* extension context invalidated */ }
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      originalReplaceState(...args);
      try { checkUrl(); } catch { /* extension context invalidated */ }
    };
  },
});
