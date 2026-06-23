import { useEffect, useMemo, useRef } from 'react';

/**
 * Split loading into first paint (skeleton) vs refetch (keep table mounted).
 */
export function useLoadingPhase(loading) {
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      hasLoadedRef.current = true;
    }
  }, [loading]);

  return useMemo(
    () => ({
      initialLoading: loading && !hasLoadedRef.current,
      refreshing: loading && hasLoadedRef.current,
    }),
    [loading],
  );
}
