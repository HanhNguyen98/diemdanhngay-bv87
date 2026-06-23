import { useState, useCallback, useEffect } from 'react';
import { useLoadingPhase } from './useLoadingPhase';

export function useStaffAttributeCatalog(api) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.list();
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (payload) => {
      const created = await api.create(payload);
      await load();
      return created;
    },
    [api, load],
  );

  const update = useCallback(
    async (code, payload) => {
      const updated = await api.update(code, payload);
      await load();
      return updated;
    },
    [api, load],
  );

  const remove = useCallback(
    async (code) => {
      await api.remove(code);
      await load();
    },
    [api, load],
  );

  const stats = {
    total: items.length,
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
    inUse: items.filter((item) => item.usageCount > 0).length,
  };

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return { items, stats, loading, initialLoading, refreshing, error, reload: load, create, update, remove };
}
