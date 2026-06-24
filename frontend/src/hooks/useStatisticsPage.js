import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../api/client';
import {
  MOBILE_HISTORY_FETCH_SIZE,
  STATISTICS_HISTORY_EXCEL_HEADERS,
  STATISTICS_UI,
} from '../constants/attendance';
import { downloadExcel } from '../utils/exportExcel';
import { daysBetweenInclusive, getStatisticsDateRange, todayISO } from '../utils/formatters';
import { getStatisticsFilterDefaults } from '../utils/filterResetDefaults';
import { useCommittedSnapshot } from './useCommittedSnapshot';
import { useFlashMessage } from './useFlashMessage';
import { useResponsivePageSize } from './useResponsivePageSize';
import { useLoadingPhase } from './useLoadingPhase';

function initialRange() {
  const { dateFrom, dateTo } = getStatisticsFilterDefaults();
  return { from: dateFrom, to: dateTo };
}

/**
 * State và handlers cho màn thống kê trưởng phòng (KPI, biểu đồ desktop, lịch sử + export).
 *
 * @param {{ deptCode: string|number }} user - Session HEAD (lọc theo ĐƠN VỊ user)
 * @returns {object} Props cho `StatisticsPage`
 */
export function useStatisticsPage(user) {
  const deptCode = user.deptCode;
  const historyPageSize = useResponsivePageSize();
  const defaultRange = useMemo(() => initialRange(), []);
  const { flash, showWarning, showError, clearFlash } = useFlashMessage();

  const [timePreset, setTimePreset] = useState(() => getStatisticsFilterDefaults().timePreset);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [appliedFrom, setAppliedFrom] = useState(defaultRange.from);
  const [appliedTo, setAppliedTo] = useState(defaultRange.to);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statsReady, setStatsReady] = useState(false);

  const statsFetchIdRef = useRef(0);
  const historyFetchIdRef = useRef(0);
  const hasStatsLoadedRef = useRef(false);
  const hasHistoryLoadedRef = useRef(false);

  const {
    snapshot: displayStatusBreakdown,
    commit: commitStatusBreakdown,
    reset: resetStatusBreakdown,
  } = useCommittedSnapshot([]);

  const {
    snapshot: displayTrend,
    commit: commitTrend,
    reset: resetTrend,
  } = useCommittedSnapshot([]);

  const {
    snapshot: displayDeptName,
    commit: commitDeptName,
    reset: resetDeptName,
  } = useCommittedSnapshot('');

  const commitStatsDisplay = useCallback(
    (result) => {
      commitStatusBreakdown(result?.summary?.statusBreakdown ?? []);
      commitTrend(result?.trend ?? []);
      commitDeptName(result?.deptName ?? '');
    },
    [commitDeptName, commitStatusBreakdown, commitTrend],
  );

  const resetStatsDisplay = useCallback(() => {
    resetStatusBreakdown([]);
    resetTrend([]);
    resetDeptName('');
  }, [resetDeptName, resetStatusBreakdown, resetTrend]);

  const validateRange = useCallback(
    (from, to) => {
      if (from > to) {
        showWarning('Ngày bắt đầu phải trước ngày kết thúc');
        return false;
      }
      if (daysBetweenInclusive(from, to) > STATISTICS_UI.maxRangeDays) {
        showWarning(STATISTICS_UI.maxRangeExceeded);
        return false;
      }
      return true;
    },
    [showWarning],
  );

  const fetchStatistics = useCallback(async () => {
    const requestId = ++statsFetchIdRef.current;
    const silent = hasStatsLoadedRef.current;
    if (!silent) {
      setLoading(true);
    }
    try {
      const result = await api.getStatistics(deptCode, appliedFrom, appliedTo, appliedSearch);
      if (requestId !== statsFetchIdRef.current) return;
      commitStatsDisplay(result);
      hasStatsLoadedRef.current = true;
      setStatsReady(true);
    } catch (err) {
      if (requestId !== statsFetchIdRef.current) return;
      showError(err.message);
      if (!hasStatsLoadedRef.current) {
        resetStatsDisplay();
      }
    } finally {
      if (requestId === statsFetchIdRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [deptCode, appliedFrom, appliedTo, appliedSearch, showError, commitStatsDisplay, resetStatsDisplay]);

  const fetchHistory = useCallback(async () => {
    const requestId = ++historyFetchIdRef.current;
    const silent = hasHistoryLoadedRef.current;
    if (!silent) {
      setHistoryLoading(true);
    }
    try {
      const page = historyPage;
      const result = await api.getStatisticsHistory(
        deptCode,
        appliedFrom,
        appliedTo,
        appliedSearch,
        page,
        historyPageSize,
      );
      if (requestId !== historyFetchIdRef.current) return;
      setHistoryData(result);
      hasHistoryLoadedRef.current = true;
    } catch (err) {
      if (requestId !== historyFetchIdRef.current) return;
      showError(err.message);
      if (!hasHistoryLoadedRef.current) {
        setHistoryData(null);
      }
    } finally {
      if (requestId === historyFetchIdRef.current && !silent) {
        setHistoryLoading(false);
      }
    }
  }, [deptCode, appliedFrom, appliedTo, appliedSearch, historyPage, historyPageSize, showError]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyPageSize]);

  const applyDateRange = useCallback(
    (from, to, searchVal = appliedSearch) => {
      if (!validateRange(from, to)) return false;
      setAppliedFrom(from);
      setAppliedTo(to);
      setAppliedSearch(searchVal);
      setHistoryPage(1);
      return true;
    },
    [appliedSearch, validateRange],
  );

  const handlePresetChange = (preset) => {
    setTimePreset(preset);
    const range = getStatisticsDateRange(preset, todayISO());
    setDateFrom(range.from);
    setDateTo(range.to);
    applyDateRange(range.from, range.to);
  };

  const handleMobilePresetChange = (preset) => {
    setTimePreset(preset);
    if (preset === 'CUSTOM') return;
    const range = getStatisticsDateRange(preset, todayISO());
    setDateFrom(range.from);
    setDateTo(range.to);
    applyDateRange(range.from, range.to);
  };

  const handleMobileDateRangeChange = useCallback(
    (from, to) => {
      setTimePreset('CUSTOM');
      setDateFrom(from);
      setDateTo(to);
      applyDateRange(from, to);
    },
    [applyDateRange],
  );

  const handleApplyFilter = () => {
    applyDateRange(dateFrom, dateTo, search);
  };

  const handleApplySearch = () => {
    applyDateRange(appliedFrom, appliedTo, search);
  };

  const resetFilters = useCallback(() => {
    const defaults = getStatisticsFilterDefaults();
    setTimePreset(defaults.timePreset);
    setDateFrom(defaults.dateFrom);
    setDateTo(defaults.dateTo);
    setSearch(defaults.search);
    applyDateRange(defaults.dateFrom, defaults.dateTo, defaults.search);
  }, [applyDateRange]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const rows = await api.exportStatisticsHistory(deptCode, appliedFrom, appliedTo, appliedSearch);
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

  const { initialLoading: statsInitialLoading, refreshing: statsRefreshing } = useLoadingPhase(loading);
  const { initialLoading: historyInitialLoading, refreshing: historyRefreshing } =
    useLoadingPhase(historyLoading);

  const showSpinner = !statsReady && loading;

  return {
    flash,
    clearFlash,
    showSpinner,
    statsInitialLoading,
    statsReady,
    timePreset,
    handlePresetChange,
    handleMobilePresetChange,
    handleMobileDateRangeChange,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    search,
    setSearch,
    handleApplyFilter,
    handleApplySearch,
    resetFilters,
    displayStatusBreakdown,
    displayTrend,
    displayDeptName,
    loading: showSpinner,
    historyItems: historyData?.items ?? [],
    historyPage,
    setHistoryPage,
    historyTotalPages: historyData?.totalPages ?? 1,
    historyTotalItems: historyData?.totalItems ?? 0,
    historyPageSize,
    historyInitialLoading,
    historyRefreshing,
    exporting,
    handleExportExcel,
    showHistoryPagination: true,
  };
}
