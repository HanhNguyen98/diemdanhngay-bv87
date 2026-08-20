import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../services/api';

const POLL_MS = 60000;

/** Poll Admin unlock-request PENDING count for sidebar badge — SPEC P15 §4.7.2. */
export function useUnlockRequestPendingCount({ enabled = true } = {}) {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await adminApi.getUnlockRequestPendingCount();
      setPendingCount(typeof data?.count === 'number' ? data.count : 0);
    } catch {
      /* ignore poll errors */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    refreshPendingCount();
    const id = setInterval(refreshPendingCount, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refreshPendingCount]);

  return { pendingCount, refreshPendingCount };
}
