import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';
import { adminApi } from '../services/api';
import { downloadExcel } from '../utils/exportExcel';
import { formatDateDMY } from '../utils/formatters';
import { defaultReminderHistoryRange, formatLogDateTime } from '../utils/reminderHistory';
import { usePagination } from './usePagination';

export function useReminderHistory({ enabled = true }) {
  const initialRange = useMemo(() => defaultReminderHistoryRange(), []);

  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getReminderHistory(from, to);
      setHistory(data.history || []);
      setStats(data.stats || []);
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
    if (!enabled) return;
    refresh(appliedFrom, appliedTo);
  }, [enabled, appliedFrom, appliedTo, refresh]);

  const applyFilter = useCallback(() => {
    if (dateFrom > dateTo) {
      setError('Từ ngày không được lớn hơn đến ngày.');
      return;
    }
    setError('');
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }, [dateFrom, dateTo]);

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

  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(
    history,
    ATTENDANCE_PAGE_SIZE,
  );

  useEffect(() => {
    goToPage(1);
  }, [appliedFrom, appliedTo, goToPage]);

  return {
    history,
    paginated,
    filteredCount: history.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    stats,
    loading,
    exporting,
    error,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyFilter,
    handleExportExcel,
  };
}
