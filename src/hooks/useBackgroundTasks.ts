import { useEffect, useState, useCallback } from 'react';
import type { BackgroundTask } from '../types/chat';

const STORAGE_KEY = 'phenochart_tasks';

export function useBackgroundTasks() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  useEffect(() => {
    // Read initial value
    browser.storage.local
      .get(STORAGE_KEY)
      .then((result) => {
        const stored = result[STORAGE_KEY] as BackgroundTask[] | undefined;
        if (Array.isArray(stored)) setTasks(stored);
      })
      .catch(() => {
        // Extension context may be invalidated
      });

    // Listen for changes
    function handleChange(
      changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    ) {
      const newVal = changes[STORAGE_KEY]?.newValue;
      if (Array.isArray(newVal)) setTasks(newVal as BackgroundTask[]);
    }

    browser.storage.onChanged.addListener(handleChange);
    return () => browser.storage.onChanged.removeListener(handleChange);
  }, []);

  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'error',
  );
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const dismissTask = useCallback((taskId: string) => {
    browser.runtime.sendMessage({ type: 'DISMISS_TASK', taskId });
  }, []);

  const openTask = useCallback(
    (taskId: string): BackgroundTask | null => {
      browser.runtime.sendMessage({ type: 'OPEN_TASK', taskId });
      return tasks.find((t) => t.id === taskId) ?? null;
    },
    [tasks],
  );

  return { tasks, activeTasks, completedTasks, dismissTask, openTask };
}
