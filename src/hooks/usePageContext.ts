import { useEffect, useState } from 'react';

interface PageContext {
  url: string;
  isEncounterPage: boolean;
  isMedPlum: boolean;
  patientId: string | null;
  encounterId: string | null;
}

const DEFAULT_CONTEXT: PageContext = {
  url: '',
  isEncounterPage: false,
  isMedPlum: false,
  patientId: null,
  encounterId: null,
};

function parsePageContext(value: unknown): PageContext | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.url === 'string' &&
    typeof obj.isEncounterPage === 'boolean' &&
    typeof obj.isMedPlum === 'boolean'
  ) {
    return {
      url: obj.url,
      isEncounterPage: obj.isEncounterPage,
      isMedPlum: obj.isMedPlum,
      patientId: typeof obj.patientId === 'string' ? obj.patientId : null,
      encounterId: typeof obj.encounterId === 'string' ? obj.encounterId : null,
    };
  }
  return null;
}

export function usePageContext() {
  const [context, setContext] = useState<PageContext>(DEFAULT_CONTEXT);

  useEffect(() => {
    // Read initial value
    browser.storage.local.get('pageContext').then((result) => {
      const parsed = parsePageContext(result.pageContext);
      if (parsed) setContext(parsed);
    }).catch(() => {
      // Extension context may be invalidated
    });

    // Listen for changes
    function handleChange(
      changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    ) {
      const parsed = parsePageContext(changes.pageContext?.newValue);
      if (parsed) setContext(parsed);
    }

    browser.storage.onChanged.addListener(handleChange);
    return () => browser.storage.onChanged.removeListener(handleChange);
  }, []);

  return context;
}
