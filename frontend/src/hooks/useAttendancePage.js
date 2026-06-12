import { useState, useEffect, useCallback, useMemo, useRef, startTransition, useDeferredValue } from 'react';
import { api } from '../api/client';
import { useAppBootstrap } from '../context/AppBootstrapContext';
import {
  ATTENDANCE_PAGE_SIZE,
  MOBILE_PAGE_SIZE,
  STATUS_BADGE,
  UI,
  isAttendanceUnchecked,
} from '../constants/attendance';
import { formatDeptCode, getRecentDates, todayISO } from '../utils/formatters';
import { useAttendanceCache } from './useAttendanceCache';
import { useFlashMessage } from './useFlashMessage';
import { useIsMobile } from './useIsMobile';

function applyStaffPatch(list, empCode, patch) {
  return list.map((s) => (s.empCode === empCode ? { ...s, ...patch } : s));
}

/**
 * State và handlers cho màn chấm công (HEAD + ADMIN preview).
 * Giữ nguyên luồng: fetch → optimistic update → gửi báo cáo → khóa sau 08:30.
 *
 * @param {{ role: string, deptCode?: string|number }} user - Session đăng nhập
 * @returns {object} Props cho `AttendancePage` (flash, staffList phân trang, handlers…)
 */
export function useAttendancePage(user) {
  const isMobile = useIsMobile();
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : ATTENDANCE_PAGE_SIZE;
  const isAdmin = user.role === 'ADMIN';
  const { fetchAttendanceDepartments } = useAppBootstrap();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(isAdmin ? 1 : user.deptCode);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [reportSent, setReportSent] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  const cache = useAttendanceCache();
  const fetchIdRef = useRef(0);
  const adminDeptsLoadedRef = useRef(false);
  const recentDates = useMemo(() => getRecentDates(4), []);
  const isToday = selectedDate === todayISO();

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
        }
      }
    },
    [cache, showError],
  );

  useEffect(() => {
    fetchAttendance(selectedDept, selectedDate);
  }, [selectedDept, selectedDate, fetchAttendance]);

  useEffect(() => {
    setPage(1);
  }, [selectedDept, selectedDate, deferredSearch, statusFilter]);

  const submitAttendance = useCallback(
    async (empCode, status, note = null) => {
      const snapshot = staffList;
      const optimistic = {
        recordId: -1,
        status,
        note,
        statusLabel: STATUS_BADGE[status]?.label || status,
      };

      setStaffList((prev) => applyStaffPatch(prev, empCode, optimistic));

      try {
        const updated = await api.updateAttendance(empCode, status, note, selectedDate);
        setStaffList((prev) => {
          const next = applyStaffPatch(prev, empCode, {
            recordId: updated.recordId,
            status: updated.status,
            statusLabel: updated.statusLabel,
            note: updated.note,
          });
          cache.set(selectedDept, selectedDate, { summary, staff: next });
          return next;
        });
      } catch (err) {
        setStaffList(snapshot);
        showError(err.message);
      }
    },
    [staffList, selectedDate, selectedDept, summary, cache, showError],
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
  const tableDisabled = !editable || locked;

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

  const stats = useMemo(
    () => ({
      diLam: summary?.diLam ?? 0,
      nghiPhep: summary?.nghiPhep ?? 0,
      diCongTac: summary?.diCongTac ?? 0,
      diHoc: summary?.diHoc ?? 0,
    }),
    [summary],
  );

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

  const refreshAttendance = useCallback(async () => {
    cache.invalidate(selectedDept, selectedDate);
    await fetchAttendance(selectedDept, selectedDate, { force: true, silent: true });
  }, [cache, fetchAttendance, selectedDept, selectedDate]);

  return {
    isAdmin,
    flash,
    clearFlash,
    showSpinner,
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
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    markedCount,
    stats,
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
    showFilter,
    setShowFilter,
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

