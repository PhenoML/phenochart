import { useEffect } from 'react';

/**
 * Global keyboard shortcut handler for the side panel.
 * - Tab: native browser focus navigation between focusable elements
 * - A: accept focused code card
 * - R: reject focused code card
 * - Escape: cancel rejection comment (handled by RejectionComment component)
 *
 * A and R are handled by individual CodeCard onKeyDown handlers.
 * This hook handles Escape at the document level as a fallback.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape: blur focused element to dismiss focus ring
      if (e.key === 'Escape') {
        const el = document.activeElement;
        if (el instanceof HTMLElement && !el.closest('textarea')) {
          el.blur();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
