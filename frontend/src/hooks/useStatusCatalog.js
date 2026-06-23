import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useLoadingPhase } from './useLoadingPhase';

export function useStatusCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listAttendanceStatusTypes();
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  const create = useCallback(
    async (payload) => {
      const created = await adminApi.createAttendanceStatusType(payload);
      await load();
      return created;
    },
    [load],
  );

  const update = useCallback(
    async (id, payload) => {
      const updated = await adminApi.updateAttendanceStatusType(id, payload);
      await load();
      return updated;
    },
    [load],
  );

  const remove = useCallback(
    async (id) => {
      await adminApi.deleteAttendanceStatusType(id);
      await load();
    },
    [load],
  );

  const stats = {
    total: items.length,
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
    inUse: items.filter((item) => item.usageCount > 0).length,
  };

  return {
    items,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    reload: load,
    create,
    update,
    remove,
  };
}
