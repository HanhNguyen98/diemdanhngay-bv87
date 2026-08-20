import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../services/api';
import { defaultReminderHistoryRange } from '../utils/reminderHistory';
import { getAttendanceAuditFilterDefaults } from '../utils/filterResetDefaults';
import { useLoadingPhase } from './useLoadingPhase';
import { useResponsivePageSize } from './useResponsivePageSize';

export function useAttendanceAuditLogs({ enabled = true }) {
  const pageSize = useResponsivePageSize();
  const initialRange = useMemo(() => defaultReminderHistoryRange(), []);

  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);
  const [deptFilter, setDeptFilterState] = useState(null);
  const [appliedDeptFilter, setAppliedDeptFilter] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  const setDeptFilterImmediate = useCallback((value) => {
    setDeptFilterState(value);
    setAppliedDeptFilter(value);
    setPage(1);
  }, []);

  const refresh = useCallback(async (from, to, deptCode, nextPage, nextSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAttendanceAuditLogs({
        from,
        to,
        deptCode: deptCode ?? undefined,
        page: nextPage,
        pageSize: nextSize,
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotalItems(data?.totalItems ?? 0);
      setTotalPages(Math.max(data?.totalPages ?? 1, 1));
      setPage(data?.page ?? nextPage);
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử thao tác.');
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const range = defaultReminderHistoryRange();
    setDateFrom(range.from);
    setDateTo(range.to);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
    setPage(1);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setDepartments([]);
      return undefined;
    }

    const controller = new AbortController();
    adminApi
      .listDepartments(undefined, { signal: controller.signal })
      .then((depts) => {
        if (!controller.signal.aborted) {
          setDepartments(Array.isArray(depts) ? depts : []);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setDepartments([]);
      });

    return () => controller.abort();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh(appliedFrom, appliedTo, appliedDeptFilter, page, pageSize);
  }, [enabled, appliedFrom, appliedTo, appliedDeptFilter, page, pageSize, refresh]);

  const applyFilter = useCallback((deptOverride) => {
    if (dateFrom > dateTo) {
      setError('Từ ngày không được lớn hơn đến ngày.');
      return;
    }
    setError('');
    const nextDept =
      deptOverride === null || typeof deptOverride === 'number' ? deptOverride : deptFilter;
    setDeptFilterState(nextDept);
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    setAppliedDeptFilter(nextDept);
    setPage(1);
  }, [dateFrom, dateTo, deptFilter]);

  const resetFilters = useCallback(() => {
    const defaults = getAttendanceAuditFilterDefaults();
    setError('');
    setDeptFilterState(defaults.deptCode);
    setDateFrom(defaults.dateFrom);
    setDateTo(defaults.dateTo);
    setAppliedFrom(defaults.dateFrom);
    setAppliedTo(defaults.dateTo);
    setAppliedDeptFilter(defaults.deptCode);
    setPage(1);
  }, []);

  const goToPage = useCallback((next) => {
    setPage((current) => Math.max(1, next ?? current));
  }, []);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return {
    items,
    filteredCount: totalItems,
    page,
    totalPages,
    pageSize,
    goToPage,
    loading,
    initialLoading,
    refreshing,
    error,
    departments,
    deptFilter,
    setDeptFilterImmediate,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyFilter,
    resetFilters,
  };
}
