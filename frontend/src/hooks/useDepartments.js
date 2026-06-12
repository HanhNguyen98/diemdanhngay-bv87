import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/api';

export function useDepartments() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const errors = [];

    try {
      const depts = await adminApi.listDepartments();
      setItems(depts);
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (payload) => {
      const created = await adminApi.createDepartment(payload);
      await load();
      return created;
    },
    [load],
  );

  const update = useCallback(
    async (deptCode, payload) => {
      const updated = await adminApi.updateDepartment(deptCode, payload);
      await load();
      return updated;
    },
    [load],
  );

  const remove = useCallback(
    async (deptCode) => {
      await adminApi.deleteDepartment(deptCode);
      await load();
    },
    [load],
  );

  return { items, stats, loading, error, reload: load, create, update, remove };
}
