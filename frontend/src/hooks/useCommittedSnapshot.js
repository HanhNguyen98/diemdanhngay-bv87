import { useCallback, useRef, useState } from 'react';

/**
 * Keep the last committed snapshot for stable UI during async refetch.
 * Call commit() only after fetch succeeds so KPI/table labels do not jump.
 */
export function useCommittedSnapshot(initialValue = null) {
  const [snapshot, setSnapshot] = useState(initialValue);
  const snapshotRef = useRef(initialValue);

  const commit = useCallback((next) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const reset = useCallback((next = null) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  return {
    snapshot,
    snapshotRef,
    commit,
    reset,
    hasSnapshot: snapshot != null,
  };
}
