import { useState, useCallback, useEffect, useRef } from 'react';
import { adminApi } from '../services/api';
import { useLoadingPhase } from './useLoadingPhase';

export function useStaff({
  initialSearch = '',
  initialDeptCode = null,
  page = 1,
  pageSize = 20,
} = {}) {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [deptFilter, setDeptFilter] = useState(initialDeptCode);
  const statsLoadedRef = useRef(false);

  const loadStats = useCallback(async () => {
    try {
      const adminStats = await adminApi.getStats();
      setStats(adminStats);
      statsLoadedRef.current = true;
    } catch (err) {
      setStats(null);
      if (!statsLoadedRef.current) {
        setError((prev) => prev || `Không tải được thống kê: ${err.message}`);
      }
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const result = await adminApi.listStaff({
        search,
        deptCode: deptFilter,
        page,
        pageSize,
        signal,
      });
      if (signal?.aborted) return;
      setItems(result.items ?? []);
      setTotalItems(result.totalItems ?? 0);
      setTotalPages(Math.max(1, result.totalPages ?? 1));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err.message);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [search, deptFilter, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const create = useCallback(
    async (payload) => {
      const created = await adminApi.createStaff(payload);
      await Promise.all([load(), loadStats()]);
      return created;
    },
    [load, loadStats],
  );

  const update = useCallback(
    async (empCode, payload) => {
      const updated = await adminApi.updateStaff(empCode, payload);
      await Promise.all([load(), loadStats()]);
      return updated;
    },
    [load, loadStats],
  );

  const remove = useCallback(
    async (empCode) => {
      await adminApi.deleteStaff(empCode);
      await Promise.all([load(), loadStats()]);
    },
    [load, loadStats],
  );

  const fetchAllFiltered = useCallback(async () => {
    const result = await adminApi.listStaff({
      search,
      deptCode: deptFilter,
      page: 1,
      pageSize: 500,
    });
    return result.items ?? [];
  }, [search, deptFilter]);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return {
    items,
    totalItems,
    totalPages,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    reload: load,
    reloadStats: loadStats,
    fetchAllFiltered,
    create,
    update,
    remove,
  };
}
