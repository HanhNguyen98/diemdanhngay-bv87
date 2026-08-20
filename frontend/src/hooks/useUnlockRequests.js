import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { useLoadingPhase } from './useLoadingPhase';

export function useUnlockRequests({ enabled = true }) {
  const [status, setStatus] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (nextStatus) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listUnlockRequests(nextStatus);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không tải được yêu cầu mở khóa.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh(status);
  }, [enabled, status, refresh]);

  const approve = useCallback(async (id) => {
    const updated = await adminApi.approveUnlockRequest(id);
    await refresh(status);
    return updated;
  }, [refresh, status]);

  const reject = useCallback(async (id, note) => {
    const updated = await adminApi.rejectUnlockRequest(id, note);
    await refresh(status);
    return updated;
  }, [refresh, status]);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return {
    status,
    setStatus,
    items,
    loading,
    initialLoading,
    refreshing,
    error,
    approve,
    reject,
    refresh: () => refresh(status),
  };
}
