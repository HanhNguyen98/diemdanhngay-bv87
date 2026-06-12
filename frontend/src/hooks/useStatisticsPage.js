import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import {
  STATISTICS_HISTORY_EXCEL_HEADERS,
  STATISTICS_HISTORY_PAGE_SIZE,
  STATISTICS_UI,
} from '../constants/attendance';
import { downloadExcel } from '../utils/exportExcel';
import { getStatisticsDateRange, todayISO } from '../utils/formatters';
import { useFlashMessage } from './useFlashMessage';

function initialRange() {
  return getStatisticsDateRange('THIS_MONTH', todayISO());
}

/**
 * State và handlers cho màn thống kê trưởng phòng (KPI, biểu đồ desktop, lịch sử + export).
 *
 * @param {{ deptCode: string|number }} user - Session HEAD (lọc theo ĐƠN VỊ user)
 * @returns {object} Props cho `StatisticsPage`
 */
export function useStatisticsPage(user) {
  const deptCode = user.deptCode;
  const defaultRange = useMemo(() => initialRange(), []);
  const { flash, showWarning, showError, clearFlash } = useFlashMessage();

  const [timePreset, setTimePreset] = useState('THIS_MONTH');
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [appliedFrom, setAppliedFrom] = useState(defaultRange.from);
  const [appliedTo, setAppliedTo] = useState(defaultRange.to);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getStatistics(
        deptCode,
        appliedFrom,
        appliedTo,
        appliedSearch,
      );
      setData(result);
    } catch (err) {
      showError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [deptCode, appliedFrom, appliedTo, appliedSearch, showError]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const pageSize = STATISTICS_HISTORY_PAGE_SIZE;
      const page = historyPage;
      const result = await api.getStatisticsHistory(
        deptCode,
        appliedFrom,
        appliedTo,
        appliedSearch,
        page,
        pageSize,
      );
      setHistoryData(result);
    } catch (err) {
      showError(err.message);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [deptCode, appliedFrom, appliedTo, appliedSearch, historyPage, showError]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const applyDateRange = useCallback((from, to, searchVal = appliedSearch) => {
    if (from > to) {
      showWarning('Ngày bắt đầu phải trước ngày kết thúc');
      return false;
    }
    setAppliedFrom(from);
    setAppliedTo(to);
    setAppliedSearch(searchVal);
    setHistoryPage(1);
    return true;
  }, [appliedSearch, showWarning]);

  const handlePresetChange = (preset) => {
    setTimePreset(preset);
    const range = getStatisticsDateRange(preset, todayISO());
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const handleMobilePresetChange = (preset) => {
    setTimePreset(preset);
    if (preset === 'CUSTOM') return;
    const range = getStatisticsDateRange(preset, todayISO());
    setDateFrom(range.from);
    setDateTo(range.to);
    applyDateRange(range.from, range.to);
  };

  const handleMobileDateFromChange = (value) => {
    setTimePreset('CUSTOM');
    setDateFrom(value);
    if (value && dateTo) applyDateRange(value, dateTo);
  };

  const handleMobileDateToChange = (value) => {
    setTimePreset('CUSTOM');
    setDateTo(value);
    if (dateFrom && value) applyDateRange(dateFrom, value);
  };

  const handleApplyFilter = () => {
    applyDateRange(dateFrom, dateTo, search);
  };

  const handleApplySearch = () => {
    applyDateRange(appliedFrom, appliedTo, search);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const rows = await api.exportStatisticsHistory(
        deptCode,
        appliedFrom,
        appliedTo,
        appliedSearch,
      );
      if (!rows.length) {
        showWarning(STATISTICS_UI.noHistory);
        return;
      }
      downloadExcel({
        filename: STATISTICS_UI.historyExportFilename,
        sheetName: STATISTICS_UI.historyExportSheet,
        headers: STATISTICS_HISTORY_EXCEL_HEADERS,
        rows: rows.map((item) => [
          item.attendanceDateFormatted,
          item.fullname,
          item.empCodeFormatted,
          item.statusLabel,
          item.note?.trim() || '—',
        ]),
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(
    () => ({
      diLam: data?.summary?.diLam ?? 0,
      nghiPhep: data?.summary?.nghiPhep ?? 0,
      diHoc: data?.summary?.diHoc ?? 0,
      diCongTac: data?.summary?.diCongTac ?? 0,
    }),
    [data],
  );

  const trend = data?.trend ?? [];
  const deptName = data?.deptName ?? '';
  const showSpinner = loading && !data;

  return {
    flash,
    clearFlash,
    showSpinner,
    timePreset,
    handlePresetChange,
    handleMobilePresetChange,
    handleMobileDateFromChange,
    handleMobileDateToChange,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    search,
    setSearch,
    handleApplyFilter,
    handleApplySearch,
    stats,
    trend,
    deptName,
    loading,
    historyItems: historyData?.items ?? [],
    historyPage,
    setHistoryPage,
    historyTotalPages: historyData?.totalPages ?? 1,
    historyTotalItems: historyData?.totalItems ?? 0,
    historyPageSize: STATISTICS_HISTORY_PAGE_SIZE,
    historyLoading,
    exporting,
    handleExportExcel,
    showHistoryPagination: true,
  };
}
