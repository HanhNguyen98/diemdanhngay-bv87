import { useState, useCallback, useEffect } from 'react';
import { headApi } from '../api/client';
import { UI } from '../constants/attendance';
import { useLoadingPhase } from './useLoadingPhase';

export function useHeadStaff() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const headStats = await headApi.getStaffStats();
      setStats(headStats);
    } catch (err) {
      setStats(null);
      setError((prev) => prev || `Không tải được thống kê: ${err.message}`);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const staff = await headApi.listStaff({ search });
      setItems(staff);
    } catch (err) {
      setItems([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(loadStaff, 200);
    return () => clearTimeout(timer);
  }, [loadStaff]);

  const updateAvatar = useCallback(async (empCode, avatarUrl) => {
    const updated = await headApi.updateStaffAvatar(empCode, avatarUrl);
    setItems((prev) =>
      prev.map((s) =>
        s.empCode === empCode ? { ...s, avatarUrl: updated.avatarUrl ?? avatarUrl } : s,
      ),
    );
    return updated;
  }, []);

  const combinedLoading = loading || statsLoading;
  const { initialLoading, refreshing } = useLoadingPhase(combinedLoading);

  return {
    items,
    stats,
    loading: combinedLoading,
    initialLoading,
    refreshing,
    error,
    search,
    setSearch,
    updateAvatar,
    reload: loadStaff,
  };
}
