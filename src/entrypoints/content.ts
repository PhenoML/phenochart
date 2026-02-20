export default defineContentScript({
  matches: [
    'https://*.medplum.com/*',
    'http://localhost:3000/*',
  ],
  main() {
    // Guard against duplicate injection (HMR / extension update)
    if ((window as unknown as Record<string, unknown>).__phenochart_injected) return;
    (window as unknown as Record<string, unknown>).__phenochart_injected = true;

    const checkUrl = () => {
      const url = window.location.href;
      browser.storage.local.set({
        pageContext: {
          url,
          isEncounterPage: /\/Encounter\//.test(url),
          isMedPlum: true,
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
