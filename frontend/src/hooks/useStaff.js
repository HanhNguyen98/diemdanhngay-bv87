import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/api';

export function useStaff(initialSearch = '', initialDeptCode = null) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [deptFilter, setDeptFilter] = useState(initialDeptCode);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const errors = [];

    try {
      const staff = await adminApi.listStaff({ search, deptCode: deptFilter });
      setItems(staff);
    } catch (err) {
      setItems([]);
      errors.push(err.message);
    }

    try {
      const adminStats = await adminApi.getStats();
      setStats(adminStats);
    } catch (err) {
      setStats(null);
      if (errors.length === 0) {
        errors.push(`Không tải được thống kê: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    setLoading(false);
  }, [search, deptFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const create = useCallback(
    async (payload) => {
      const created = await adminApi.createStaff(payload);
      await load();
      return created;
    },
    [load],
  );

  const update = useCallback(
    async (empCode, payload) => {
      const updated = await adminApi.updateStaff(empCode, payload);
      await load();
      return updated;
    },
    [load],
  );

  const remove = useCallback(
    async (empCode) => {
      await adminApi.deleteStaff(empCode);
      await load();
    },
    [load],
  );

  return {
    items,
    stats,
    loading,
    error,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    reload: load,
    create,
    update,
    remove,
  };
}
