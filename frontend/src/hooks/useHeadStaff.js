import { useState, useCallback, useEffect } from 'react';
import { headApi } from '../services/api';

export function useHeadStaff() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const errors = [];

    try {
      const staff = await headApi.listStaff({ search });
      setItems(staff);
    } catch (err) {
      setItems([]);
      errors.push(err.message);
    }

    try {
      const headStats = await headApi.getStaffStats();
      setStats(headStats);
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
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const updateAvatar = useCallback(
    async (empCode, avatarUrl) => {
      const updated = await headApi.updateStaffAvatar(empCode, avatarUrl);
      await load();
      return updated;
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
    updateAvatar,
    reload: load,
  };
}
