import { useState, useEffect, useCallback, useMemo, useRef, startTransition, useDeferredValue } from 'react';
import { api } from '../api/client';
import { useAppBootstrap } from '../context/AppBootstrapContext';
import {
  ATTENDANCE_STATUS,
  UI,
  isAttendanceUnchecked,
  isPostScanOverrideAction,
  needsNghiTrucWizard,
} from '../constants/attendance';
import { useAttendanceStatusConfig } from '../context/AttendanceStatusContext';
import { formatDeptCode, getRecentDates, todayISO } from '../utils/formatters';
import { buildBreakdownFromStaff } from '../utils/statusBreakdown';
import { useAttendanceCache } from './useAttendanceCache';
import { useFlashMessage } from './useFlashMessage';
import { useResponsivePageSize } from './useResponsivePageSize';

/**
 * State và handlers cho màn Chấm công (HEAD + ADMIN preview).
 * Luồng: fetch → manual-range ngoại lệ; dữ liệu realtime Admin (P5 — bỏ gửi báo cáo).
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
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [requestUnlockOpen, setRequestUnlockOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [manualRangeTarget, setManualRangeTarget] = useState(null);
  const [nghiTrucTarget, setNghiTrucTarget] = useState(null);
  const [manualRangeSaving, setManualRangeSaving] = useState(false);
  const [missingPunches, setMissingPunches] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);

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

  // SPEC §4.8.1 — FE quick-action only opens manual-range modal (no single-day PUT)

  const handleQuickAction = useCallback(
    (empCode, action) => {
      const staff = staffListRef.current.find((s) => s.empCode === empCode);
      if (!staff) return;
      if (isPostScanOverrideAction(action) && needsNghiTrucWizard(staff)) {
        setNghiTrucTarget({ staff });
        return;
      }
      setManualRangeTarget({
        staff,
        status: action.value,
        statusLabel: statusBadge[action.value]?.label || action.label || action.value,
        statusOptions: action.statusOptions || [],
        isNghiTruc: isPostScanOverrideAction(action),
      });
    },
    [statusBadge],
  );

  const handleNghiTrucWizardSaved = useCallback(
    async (result) => {
      showSuccess(result?.message || UI.nghiTrucWizardSuccess);
      cache.invalidate(selectedDept, selectedDate);
      await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
    },
    [cache, selectedDate, selectedDept, fetchAttendance, showSuccess],
  );

  const handleManualRangeConfirm = useCallback(
    async ({ status, fromDate, toDate, note }) => {
      if (!manualRangeTarget || manualRangeSaving) return;
      const { staff, status: fallbackStatus } = manualRangeTarget;
      setManualRangeSaving(true);
      try {
        const result = await api.updateAttendanceManualRange({
          empCode: staff.empCode,
          status: status || fallbackStatus,
          fromDate,
          toDate,
          note,
        });
        showSuccess(result.message || 'Đã cập nhật Chấm công.');
        setManualRangeTarget(null);
        cache.invalidate(selectedDept, selectedDate);
        await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
      } catch (err) {
        showError(err.message);
      } finally {
        setManualRangeSaving(false);
      }
    },
    [
      manualRangeTarget,
      manualRangeSaving,
      selectedDept,
      selectedDate,
      cache,
      fetchAttendance,
      showSuccess,
      showError,
    ],
  );

  const handleVeSomNoteSave = useCallback(
    async (empCode, note) => {
      try {
        await api.updateAttendance(empCode, ATTENDANCE_STATUS.VE_SOM, note, selectedDate);
        showSuccess('Đã lưu lý do về sớm.');
        cache.invalidate(selectedDept, selectedDate);
        await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
      } catch (err) {
        showError(err.message || UI.veSomNoteRequired);
        throw err;
      }
    },
    [selectedDate, selectedDept, cache, fetchAttendance, showSuccess, showError],
  );

  const handleUnlockConfirm = async (reason) => {
    await api.unlockDepartment(unlockTarget.deptCode, reason, selectedDate);
    showSuccess(
      UI.unlockSuccess(formatDeptCode(unlockTarget.deptCode), selectedDate),
    );
    cache.invalidate(selectedDept, selectedDate);
    await fetchAttendance(selectedDept, selectedDate, { force: true });
    setUnlockTarget(null);
  };

  const handleRelock = useCallback(async () => {
    try {
      await api.relockDepartment(selectedDept, selectedDate);
      showSuccess(UI.relockSuccess(formatDeptCode(selectedDept), selectedDate));
      cache.invalidate(selectedDept, selectedDate);
      await fetchAttendance(selectedDept, selectedDate, { force: true });
    } catch (err) {
      showError(err.message);
    }
  }, [selectedDept, selectedDate, cache, fetchAttendance, showSuccess, showError]);

  const handleUnlockRequestConfirm = async (reason) => {
    await api.requestUnlockDepartment(selectedDate, reason);
    showSuccess(UI.unlockRequestSuccess);
    cache.invalidate(selectedDept, selectedDate);
    await fetchAttendance(selectedDept, selectedDate, { force: true });
    setRequestUnlockOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadMissing() {
      if (!selectedDept || !selectedDate) {
        setMissingPunches([]);
        return;
      }
      setMissingLoading(true);
      try {
        const data = await api.getMissingPunches(selectedDept, selectedDate);
        if (!cancelled) {
          setMissingPunches(data?.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setMissingPunches([]);
        }
      } finally {
        if (!cancelled) {
          setMissingLoading(false);
        }
      }
    }
    loadMissing();
    return () => {
      cancelled = true;
    };
  }, [selectedDept, selectedDate, staffList]);

  const selectedDeptInfo = departments.find((d) => d.deptCode === selectedDept);
  const selectedDeptName = selectedDeptInfo?.deptName || summary?.deptName || '';
  const locked = summary?.locked ?? false;
  const editable = summary?.editable ?? false;
  // P5 / P6 / P14 — reportBlocked = full roster lock; soft-lock = today writes only
  const reportBlocked = Boolean(summary?.reportBlocked);
  const selectedDateWriteDisabled = !isAdmin && !editable;
  const softLocked = isToday && selectedDateWriteDisabled && !reportBlocked;
  const pastDateLocked = !isToday && selectedDateWriteDisabled && !reportBlocked;
  const tableDisabled =
    (!isAdmin && reportBlocked) ||
    manualRangeSaving ||
    (!isToday && selectedDateWriteDisabled);
  const todayWriteDisabled = isToday && selectedDateWriteDisabled;
  /** AI batch / write tools — blocked by soft-lock, past lock, or reportBlocked */
  const aiWriteDisabled =
    selectedDateWriteDisabled || (!isAdmin && reportBlocked) || manualRangeSaving;
  const unlocked = summary?.unlocked;
  const unlockRequestStatus = summary?.unlockRequestStatus ?? null;
  const unlockRequestPending = unlockRequestStatus === 'PENDING';
  const unlockRequestRejected = unlockRequestStatus === 'REJECTED' && !unlocked;
  const canRequestUnlock =
    !isAdmin &&
    !unlocked &&
    selectedDate <= todayISO() &&
    !unlockRequestPending &&
    (pastDateLocked || softLocked);

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
    unlocked,
    editable,
    softLocked,
    pastDateLocked,
    tableDisabled,
    todayWriteDisabled,
    aiWriteDisabled,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    handleRelock,
    requestUnlockOpen,
    setRequestUnlockOpen,
    handleUnlockRequestConfirm,
    canRequestUnlock,
    unlockRequestPending,
    unlockRequestRejected,
    statusBreakdown,
    total: summary?.total || staffList.length,
    pageSize,
    reportBlocked: summary?.reportBlocked ?? false,
    lockTime: summary?.lockTime ?? null,
    missingPunches,
    missingLoading,
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
    handleVeSomNoteSave,
    nghiTrucTarget,
    setNghiTrucTarget,
    handleNghiTrucWizardSaved,
    manualRangeTarget,
    setManualRangeTarget,
    manualRangeSaving,
    handleManualRangeConfirm,
    refreshAttendance,
  };
}
