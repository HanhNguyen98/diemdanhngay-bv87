import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useLoadingPhase } from './useLoadingPhase';

export function useDepartmentGroups() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const groups = await adminApi.listDepartmentGroups();
      setItems(groups.filter((g) => g.active !== false));
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

  const create = useCallback(
    async (payload) => {
      const created = await adminApi.createDepartmentGroup(payload);
      await load();
      return created;
    },
    [load],
  );

  const update = useCallback(
    async (groupCode, payload) => {
      const updated = await adminApi.updateDepartmentGroup(groupCode, payload);
      await load();
      return updated;
    },
    [load],
  );

  const remove = useCallback(
    async (groupCode) => {
      await adminApi.deleteDepartmentGroup(groupCode);
      await load();
    },
    [load],
  );

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return { items, loading, initialLoading, refreshing, error, reload: load, create, update, remove };
}
