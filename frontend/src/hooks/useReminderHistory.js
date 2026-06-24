import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { adminApi } from '../services/api';
import { downloadExcel } from '../utils/exportExcel';
import { formatDateDMY } from '../utils/formatters';
import { defaultReminderHistoryRange, formatLogDateTime } from '../utils/reminderHistory';
import { getReminderHistoryFilterDefaults } from '../utils/filterResetDefaults';
import { useLoadingPhase } from './useLoadingPhase';
import { usePagination } from './usePagination';
import { useResponsivePageSize } from './useResponsivePageSize';

export function useReminderHistory({ enabled = true }) {
  const pageSize = useResponsivePageSize();
  const initialRange = useMemo(() => defaultReminderHistoryRange(), []);

  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilterState] = useState(null);
  const [appliedDeptFilter, setAppliedDeptFilter] = useState(null);
  const [error, setError] = useState('');

  const setDeptFilterImmediate = useCallback((value) => {
    setDeptFilterState(value);
    setAppliedDeptFilter(value);
  }, []);

  const refresh = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getReminderHistory(from, to);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setStats(Array.isArray(data?.stats) ? data.stats : []);
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử nhắc nhở.');
      setHistory([]);
      setStats([]);
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
    refresh(appliedFrom, appliedTo);
  }, [enabled, appliedFrom, appliedTo, refresh]);

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
  }, [dateFrom, dateTo, deptFilter]);

  const resetFilters = useCallback(() => {
    const { deptCode, dateFrom, dateTo } = getReminderHistoryFilterDefaults();
    setError('');
    setDeptFilterState(deptCode);
    setDateFrom(dateFrom);
    setDateTo(dateTo);
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    setAppliedDeptFilter(deptCode);
  }, []);

  const handleExportExcel = useCallback(() => {
    const { dashboard: d } = ADMIN_UI;
    if (history.length === 0) {
      setError(d.reminderHistoryEmpty);
      return;
    }
    setExporting(true);
    try {
      const triggerLabel = (type) =>
        type === 'AUTO' ? d.reminderTriggerAuto : d.reminderTriggerManual;
      downloadExcel({
        filename: `lich-su-nhac-nho_${appliedFrom}_${appliedTo}.xlsx`,
        sheetName: d.reminderHistoryExportSheet,
        headers: [
          d.reminderHistoryColDate,
          d.reminderHistoryColDept,
          d.reminderHistoryColType,
          d.reminderHistoryColTime,
        ],
        rows: history.map((row) => [
          formatDateDMY(row.attendanceDate),
          row.deptName,
          triggerLabel(row.triggerType),
          formatLogDateTime(row.createdAt),
        ]),
      });
    } finally {
      setExporting(false);
    }
  }, [appliedFrom, appliedTo, history]);

  const filtered = useMemo(() => {
    if (appliedDeptFilter == null) return history;
    return history.filter((row) => row.deptCode === appliedDeptFilter);
  }, [history, appliedDeptFilter]);

  const { page, totalPages, paginated, goToPage } = usePagination(
    filtered,
    pageSize,
  );

  useEffect(() => {
    goToPage(1);
  }, [appliedFrom, appliedTo, appliedDeptFilter, goToPage]);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return {
    history,
    paginated,
    filteredCount: filtered.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    stats,
    departments,
    loading,
    initialLoading,
    refreshing,
    exporting,
    error,
    deptFilter,
    setDeptFilterImmediate,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyFilter,
    resetFilters,
    handleExportExcel,
  };
}
