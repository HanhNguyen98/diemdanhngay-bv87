import { useState, useEffect, useCallback, useMemo, useRef, startTransition, useDeferredValue } from 'react';
import { api } from '../api/client';
import { useAppBootstrap } from '../context/AppBootstrapContext';
import {
  UI,
  isAttendanceUnchecked,
} from '../constants/attendance';
import { useAttendanceStatusConfig } from '../context/AttendanceStatusContext';
import { formatDeptCode, getRecentDates, todayISO } from '../utils/formatters';
import { buildBreakdownFromStaff } from '../utils/statusBreakdown';
import { useAttendanceCache } from './useAttendanceCache';
import { useFlashMessage } from './useFlashMessage';
import { useResponsivePageSize } from './useResponsivePageSize';

function applyStaffPatch(list, empCode, patch) {
  return list.map((s) => (s.empCode === empCode ? { ...s, ...patch } : s));
}

/**
 * State và handlers cho màn Điểm danh (HEAD + ADMIN preview).
 * Luồng: fetch → optimistic update → gửi báo cáo → khóa sau 16:00.
 *
 * @param {{ role: string, deptCode?: string|number }} user - Session đăng nhập
 * @returns {object} Props cho `AttendancePage` (flash, staffList phân trang, handlers…)
 */
export function useAttendancePage(user) {
  const { statusBadge, items: statusCatalogItems } = useAttendanceStatusConfig();
  const pageSize = useResponsivePageSize();
  const isAdmin = user.role === 'ADMIN';
  const { fetchAttendanceDepartments } = useAppBootstrap();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(isAdmin ? 1 : user.deptCode);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [reportSent, setReportSent] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  const cache = useAttendanceCache();
  const fetchIdRef = useRef(0);
  const adminDeptsLoadedRef = useRef(false);
  const staffListRef = useRef(staffList);
  const summaryRef = useRef(summary);
  const recentDates = useMemo(() => getRecentDates(4), []);
  const isToday = selectedDate === todayISO();

  useEffect(() => {
    staffListRef.current = staffList;
  }, [staffList]);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const handleDateChange = useCallback((date) => {
    if (date === selectedDate) return;
    startTransition(() => setSelectedDate(date));
  }, [selectedDate]);

  useEffect(() => {
    if (!isAdmin || adminDeptsLoadedRef.current) return;
    adminDeptsLoadedRef.current = true;

    let cancelled = false;
    fetchAttendanceDepartments()
      .then((depts) => {
        if (!cancelled) setDepartments(depts);
      })
      .catch((err) => {
        if (!cancelled) showError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, fetchAttendanceDepartments, showError]);

  const fetchAttendance = useCallback(
    async (deptCode, date, { force = false, silent = false } = {}) => {
      const cached = !force ? cache.get(deptCode, date) : null;
      const requestId = ++fetchIdRef.current;

      if (cached) {
        setSummary(cached.summary);
        setStaffList(cached.staff);
        setInitialLoading(false);
        return;
      }

      if (!silent) {
        setInitialLoading(true);
      } else {
        setFetching(true);
      }

      try {
        const pageData = await api.getAttendancePage(deptCode, date);

        if (requestId !== fetchIdRef.current) return;

        cache.set(deptCode, date, { summary: pageData.summary, staff: pageData.staff });
        setSummary(pageData.summary);
        setStaffList(pageData.staff);
      } catch (err) {
        if (requestId === fetchIdRef.current) showError(err.message);
      } finally {
        if (requestId === fetchIdRef.current) {
          setInitialLoading(false);
          setFetching(false);
        }
      }
    },
    [cache, showError],
  );

  useEffect(() => {
    const hasData = Boolean(summaryRef.current) || staffListRef.current.length > 0;
    fetchAttendance(selectedDept, selectedDate, { silent: hasData });
  }, [selectedDept, selectedDate, fetchAttendance]);

  useEffect(() => {
    setPage(1);
  }, [selectedDept, selectedDate, deferredSearch, statusFilter]);

  const syncBreakdown = useCallback(
    (nextStaff) => {
      const breakdown = buildBreakdownFromStaff(nextStaff, statusCatalogItems);
      const baseSummary = summaryRef.current;
      if (baseSummary) {
        const nextSummary = { ...baseSummary, statusBreakdown: breakdown };
        setSummary(nextSummary);
        cache.set(selectedDept, selectedDate, { summary: nextSummary, staff: nextStaff });
      }
      return breakdown;
    },
    [cache, selectedDate, selectedDept, statusCatalogItems],
  );

  const submitAttendance = useCallback(
    async (empCode, status, note = null) => {
      if (submitting) return;

      const snapshot = staffListRef.current;
      const optimistic = {
        recordId: -1,
        status,
        note,
        statusLabel: statusBadge[status]?.label || status,
      };

      setSubmitting(true);
      setStaffList((prev) => {
        const next = applyStaffPatch(prev, empCode, optimistic);
        syncBreakdown(next);
        return next;
      });

      try {
        const updated = await api.updateAttendance(empCode, status, note, selectedDate);
        setStaffList((prev) => {
          const next = applyStaffPatch(prev, empCode, {
            recordId: updated.recordId,
            status: updated.status,
            statusLabel: updated.statusLabel,
            note: updated.note,
          });
          syncBreakdown(next);
          return next;
        });
      } catch (err) {
        setStaffList(snapshot);
        if (summaryRef.current) {
          syncBreakdown(snapshot);
        }
        showError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
    [selectedDate, showError, statusBadge, submitting, syncBreakdown],
  );

  const handleQuickAction = useCallback(
    (empCode, action) => {
      submitAttendance(empCode, action);
    },
    [submitAttendance],
  );

  const handleUnlockConfirm = async (reason) => {
    await api.unlockDepartment(unlockTarget.deptCode, reason);
    showSuccess(`Đã cấp quyền mở khóa cho Đơn vị ${formatDeptCode(unlockTarget.deptCode)}`);
    cache.invalidate(selectedDept, selectedDate);
    await fetchAttendance(selectedDept, selectedDate, { force: true });
    setUnlockTarget(null);
  };

  useEffect(() => {
    setReportSent(Boolean(summary?.reportSubmitted));
  }, [summary?.reportSubmitted]);

  const selectedDeptInfo = departments.find((d) => d.deptCode === selectedDept);
  const selectedDeptName = selectedDeptInfo?.deptName || summary?.deptName || '';
  const locked = summary?.locked ?? false;
  const editable = (summary?.editable ?? false) && isToday;
  const tableDisabled = !editable || locked || submitting;

  const markedCount = useMemo(
    () => staffList.filter((s) => !isAttendanceUnchecked(s)).length,
    [staffList],
  );

  const handleSendReport = useCallback(() => {
    if (summary?.reportBlocked) {
      showWarning(UI.reportBlocked);
      return;
    }
    if (markedCount < staffList.length) {
      showWarning(UI.reportIncomplete);
      return;
    }
    setReportModalOpen(true);
  }, [markedCount, staffList.length, summary?.reportBlocked, showWarning]);

  const handleSendReportConfirm = useCallback(async () => {
    setReportSending(true);
    try {
      await api.submitReport(selectedDept, selectedDate);
      setReportSent(true);
      showSuccess(UI.reportSendSuccess);
      setReportModalOpen(false);
      cache.invalidate(selectedDept, selectedDate);
      await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
    } catch (err) {
      showError(err.message);
    } finally {
      setReportSending(false);
    }
  }, [cache, fetchAttendance, selectedDate, selectedDept, showSuccess, showError]);

  const statusBreakdown = useMemo(() => {
    if (staffList.length > 0 && statusCatalogItems.length > 0) {
      return buildBreakdownFromStaff(staffList, statusCatalogItems);
    }
    return summary?.statusBreakdown ?? [];
  }, [staffList, statusCatalogItems, summary?.statusBreakdown]);

  const filteredStaff = useMemo(() => {
    let list = staffList;
    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.fullname?.toLowerCase().includes(q) ||
          String(s.empCode).includes(q) ||
          (s.empCodeFormatted || '').includes(q) ||
          (s.positionName || '').toLowerCase().includes(q) ||
          (s.rankName || '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'UNCHECKED') {
        list = list.filter((s) => isAttendanceUnchecked(s));
      } else {
        list = list.filter((s) => !isAttendanceUnchecked(s) && s.status === statusFilter);
      }
    }
    return list;
  }, [staffList, deferredSearch, statusFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filteredStaff.length, pageSize, page]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const pagedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);
  const showSpinner = initialLoading && !summary;
  const refreshing = fetching;

  const refreshAttendance = useCallback(async () => {
    cache.invalidate(selectedDept, selectedDate);
    await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
  }, [cache, fetchAttendance, selectedDept, selectedDate]);

  return {
    isAdmin,
    flash,
    clearFlash,
    showSpinner,
    refreshing,
    selectedDept,
    setSelectedDept,
    departments,
    selectedDeptName,
    selectedDate,
    recentDates,
    isToday,
    handleDateChange,
    locked,
    lockMessage: summary?.lockMessage,
    unlocked: summary?.unlocked,
    editable,
    tableDisabled,
    submitting,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    markedCount,
    statusBreakdown,
    total: summary?.total || staffList.length,
    pageSize,
    reportSent,
    reportBlocked: summary?.reportBlocked ?? false,
    reportModalOpen,
    setReportModalOpen,
    reportSending,
    handleSendReport,
    handleSendReportConfirm,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredStaff,
    pagedStaff,
    page,
    setPage,
    totalPages,
    filteredCount: filteredStaff.length,
    handleQuickAction,
    refreshAttendance,
  };
}
