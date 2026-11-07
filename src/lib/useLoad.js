import { useCallback, useEffect, useState } from 'react';

/** Runs a loader once per key, and exposes { data, error, retry }. */
export function useLoad(loader, key) {
  const [state, setState] = useState({ data: null, error: null, key });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    loader().then(
      (data) => {
        if (live) setState({ data, error: null, key });
      },
      (error) => {
        if (live) setState({ data: null, error, key });
      },
    );
    return () => {
      live = false;
    };
    // The loader is expected to change only when the key does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    setState({ data: null, error: null, key });
    setAttempt((a) => a + 1);
  }, [key]);

  const current = state.key === key ? state : { data: null, error: null };
  return { data: current.data, error: current.error, retry };
}
