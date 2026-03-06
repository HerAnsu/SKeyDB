import {useCallback, useEffect, useRef, useState} from 'react';

interface UseTimedToastOptions {
  readonly defaultDurationMs?: number;
}

export function useTimedToast({
  defaultDurationMs = 3200,
}: UseTimedToastOptions = {}) {
  const [toastEntries, setToastEntries] = useState<
    {readonly id: number; readonly message: string}[]
  >([]);
  const nextToastIdRef = useRef(0);
  const timeoutRefs = useRef<Map<number, number>>(new Map());

  const clearToast = useCallback(() => {
    for (const timeoutId of timeoutRefs.current.values()) {
      window.clearTimeout(timeoutId);
    }
    timeoutRefs.current.clear();
    setToastEntries([]);
  }, []);

  const removeToastById = useCallback((toastId: number) => {
    timeoutRefs.current.delete(toastId);
    setToastEntries((previous) =>
      previous.filter((entry) => entry.id !== toastId),
    );
  }, []);

  const showToast = useCallback(
    (message: string, durationMs = defaultDurationMs) => {
      const toastId = nextToastIdRef.current;
      nextToastIdRef.current += 1;

      setToastEntries((previous) => [...previous, {id: toastId, message}]);

      const timeoutId = window.setTimeout(() => {
        removeToastById(toastId);
      }, durationMs);

      timeoutRefs.current.set(toastId, timeoutId);
    },
    [defaultDurationMs, removeToastById],
  );

  useEffect(
    () => () => {
      for (const timeoutId of timeoutRefs.current.values()) {
        window.clearTimeout(timeoutId);
      }
      timeoutRefs.current.clear();
    },
    [],
  );

  const toastMessages = toastEntries.map((entry) => entry.message);
  const toastMessage = toastMessages.at(-1) ?? null;

  return {toastEntries, toastMessage, toastMessages, showToast, clearToast};
}
