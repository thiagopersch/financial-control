'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Debounce de um callback de 1 argumento.
 * - `run(value)`: agenda a chamada (reinicia o timer a cada chamada).
 * - `flush(value)`: cancela o agendamento e chama imediatamente.
 * - `cancel()`: descarta a chamada pendente.
 * - `isPending`: há chamada agendada.
 */
export function useDebouncedCallback<T>(callback: (value: T) => void, delay = 400) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPending(false);
  }, []);

  const flush = useCallback(
    (value: T) => {
      cancel();
      callbackRef.current(value);
    },
    [cancel],
  );

  const run = useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPending(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setIsPending(false);
        callbackRef.current(value);
      }, delay);
    },
    [delay],
  );

  return useMemo(() => ({ run, flush, cancel, isPending }), [run, flush, cancel, isPending]);
}
